# Project Report: Recursive Algorithms & Climate Resilience

## 1. Introduction
This project utilizes functional programming paradigms to assess how volatile climate conditions impact staple crop yield. By modeling crop yield sequentially, we can understand both short-term shocks and long-term degradation.

## 2. Recursive Projection Algorithm
The core of the yield projection uses a recursive algorithm where `Year N` relies completely on the computed outcome of `Year N-1`.

### Theoretical Model
```haskell
yieldProjection :: CropType -> ClimateParams -> Int -> [YieldValue]
```
Base Condition (Year 0): Evaluates the standard ideal yield for the specific crop.
Recursive Step (Year N): The algorithm fetches the entire history `helper(N-1)`. It then extracts the yield of `Year N-1` and applies a climate stress mutation function to calculate `Year N`:
$Yield_N = Yield_{N-1} \times Multiplier(Temp, Rain, CO_2)$

Using a helper function we build an array cumulatively entirely adhering to functional purity.

## 3. Climate Resilience Scoring
The Resilience Score is calculated using a **Recursive Weighted Average**, emphasizing earlier drop-offs as more detrimental to total resilience than later drop-offs.

### Formulation
```haskell
resilienceScoreRec :: [YieldValue] -> Double -> Double
resilienceScoreRec [] _ = 0
resilienceScoreRec [y] w = yield y * w
resilienceScoreRec (y:ys) w = (yield y * w) + resilienceScoreRec ys (w * 0.9)
```
Each successive year is weighted slightly less (multiplied by `0.9`). This ensures that a crop that survives well for 5 years and crashes in year 10 creates a higher aggregate score than a crop that dies instantly in year 1.

The resulting index is normalized between `0% - 100%`, dynamically mapping to color-coded feedback mechanisms on the JS dashboard.
