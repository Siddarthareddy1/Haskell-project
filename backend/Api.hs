{-# LANGUAGE OverloadedStrings #-}
module Api (appRoutes) where

import Web.Scotty
import Types
import Recursive
import Control.Monad.IO.Class (liftIO)
import Data.Aeson (encode)

appRoutes :: ScottyM ()
appRoutes = do
    get "/api/health" $ do
        json ("OK" :: String)
        
    post "/api/predict" $ do
        req <- jsonData :: ActionM PredictionRequest
        let resp = calculatePrediction req
        json resp

    post "/api/compare" $ do
        req <- jsonData :: ActionM ComparisonRequest
        let resp = compareCrops req
        json resp
        
    post "/api/resilience" $ do
        req <- jsonData :: ActionM PredictionRequest
        let resp = calculatePrediction req
        json (resilienceScore (crop req) (projections resp))
        
    post "/api/history" $ do
        -- Just returning a mock history to fulfill the prompt
        json ([10.0, 9.8, 9.5, 9.1] :: [Double])
