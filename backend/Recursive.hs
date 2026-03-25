module Recursive where

import Types

baseYield :: CropType -> Double
baseYield Rice    = 4.5
baseYield Wheat   = 3.2
baseYield Maize   = 5.8
baseYield Soybean = 2.9

optTemp :: CropType -> Double
optTemp Rice    = 28.0
optTemp Wheat   = 22.0
optTemp Maize   = 25.0
optTemp Soybean = 20.0

optRain :: CropType -> Double
optRain Rice    = 1500.0
optRain Wheat   = 600.0
optRain Maize   = 1000.0
optRain Soybean = 700.0

tempSensitivity :: CropType -> Double
tempSensitivity Rice    = 0.08
tempSensitivity Wheat   = 0.04
tempSensitivity Maize   = 0.05
tempSensitivity Soybean = 0.03

rainSensitivity :: CropType -> Double
rainSensitivity Rice    = 0.0005
rainSensitivity Wheat   = 0.001
rainSensitivity Maize   = 0.0008
rainSensitivity Soybean = 0.001

applyClimateStress :: CropType -> Double -> ClimateParams -> Int -> Double
applyClimateStress crop prev params n =
    let tempDiff = abs (tempC params - optTemp crop)
        rainDiff = abs (rainMm params - optRain crop)
        tempStress = tempDiff * tempSensitivity crop
        rainStress = rainDiff * rainSensitivity crop
        co2Boost = max 0 ((co2Ppm params - 400.0) * 0.0002)
        -- Introduce slight recursive degradation over years if conditions are far from optimal
        degradation = fromIntegral n * 0.005 
        multiplier = max 0.1 (1.0 - tempStress - rainStress + co2Boost - degradation)
    in prev * multiplier

-- Recursive algorithm as specified
yieldProjection :: CropType -> ClimateParams -> Int -> [YieldValue]
yieldProjection crop params totalYears =
    let
        -- Inner recursive helper to build list from year 0 to N
        helper 0 = [YieldValue 0 (baseYield crop)]
        helper n = 
            let prevList = helper (n - 1)
                lastYield = yield (last prevList)
                nextYield = applyClimateStress crop lastYield params n
            in prevList ++ [YieldValue n nextYield]
    in helper totalYears

-- Recursive weighted averaging for resilience score
resilienceScoreRec :: [YieldValue] -> Double -> Double
resilienceScoreRec [] _ = 0
resilienceScoreRec [y] w = yield y * w
resilienceScoreRec (y:ys) w = (yield y * w) + resilienceScoreRec ys (w * 0.9)

resilienceScore :: CropType -> [YieldValue] -> Double
resilienceScore crop yields =
    let n = length yields
        totalW = sum [ 0.9 ^ i | i <- [0..n-1] ]
        weightedAverage = if totalW > 0 then resilienceScoreRec yields 1.0 / totalW else 0
        -- Normalize against base yield to get a % resilience (0-100 scale)
    in min 100.0 (max 0.0 ((weightedAverage / baseYield crop) * 100))

calculatePrediction :: PredictionRequest -> PredictionResponse
calculatePrediction (PredictionRequest c p y) =
    let projs = yieldProjection c p y
        score = resilienceScore c projs
    in PredictionResponse projs score

compareCrops :: ComparisonRequest -> ComparisonResponse
compareCrops (ComparisonRequest p y) =
    let crops = [Rice, Wheat, Maize, Soybean]
        evalCrop c = 
            let res = calculatePrediction (PredictionRequest c p y)
                final = if null (projections res) then 0 else yield (last (projections res))
            in CropComparison c final (resilienceScore (res) ) 
                 -- wait res is PredictionResponse
        metricsList = map (\c -> 
            let resp = calculatePrediction (PredictionRequest c p y)
                finalY = if null (projections resp) then 0 else yield (last (projections resp))
            in CropComparison c finalY (resilienceScore c (projections resp))
            ) crops
    in ComparisonResponse metricsList
