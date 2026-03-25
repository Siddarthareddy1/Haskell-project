{-# LANGUAGE DeriveGeneric #-}
module Types where

import Data.Aeson (FromJSON, ToJSON)
import GHC.Generics (Generic)
import Data.Text (Text)

data CropType = Rice | Wheat | Maize | Soybean
  deriving (Show, Eq, Generic, Read)

instance FromJSON CropType
instance ToJSON CropType

data ClimateParams = ClimateParams
  { tempC :: Double
  , rainMm :: Double
  , co2Ppm :: Double
  } deriving (Show, Eq, Generic)

instance FromJSON ClimateParams
instance ToJSON ClimateParams

data PredictionRequest = PredictionRequest
  { crop :: CropType
  , params :: ClimateParams
  , years :: Int
  } deriving (Show, Generic)

instance FromJSON PredictionRequest
instance ToJSON PredictionRequest

data YieldValue = YieldValue
  { year :: Int
  , yield :: Double
  } deriving (Show, Generic)

instance FromJSON YieldValue
instance ToJSON YieldValue

data PredictionResponse = PredictionResponse
  { projections :: [YieldValue]
  , resilienceScore :: Double
  } deriving (Show, Generic)

instance FromJSON PredictionResponse
instance ToJSON PredictionResponse

data ComparisonRequest = ComparisonRequest
  { compParams :: ClimateParams
  , compYears :: Int
  } deriving (Show, Generic)

instance FromJSON ComparisonRequest
instance ToJSON ComparisonRequest

data ComparisonResponse = ComparisonResponse
  { metrics :: [CropComparison]
  } deriving (Show, Generic)

instance FromJSON ComparisonResponse
instance ToJSON ComparisonResponse

data CropComparison = CropComparison
  { compareCrop :: CropType
  , finalYield :: Double
  , score :: Double
  } deriving (Show, Generic)

instance FromJSON CropComparison
instance ToJSON CropComparison
