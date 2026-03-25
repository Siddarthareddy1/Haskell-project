{-# LANGUAGE OverloadedStrings #-}
module Main where

import Web.Scotty
import Network.Wai.Middleware.Cors (simpleCors)
import Api (appRoutes)

main :: IO ()
main = do
    putStrLn "Starting Capstone Crop Analytics backend on port 8080..."
    scotty 8080 $ do
        middleware simpleCors
        appRoutes
