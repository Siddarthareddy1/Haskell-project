# Recursive Analytics for Sustainable Crop Yield Projections

## Overview
This Capstone Project provides a full-stack tool for assessing climate resilience in staple crops (Rice, Wheat, Maize, Soybean) using a recursive algorithm written in Haskell and visualized in a professional, responsive D3/Chart.js frontend.

## Project Structure
- `backend/`: Haskell server using Scotty and Aeson. Contains API definitions, data types, and recursive algorithms.
- `frontend/`: HTML/CSS/JS files comprising the dark-themed user interface.
- `Report.md`: A detailed report on the recursive approaches for climate resilience scoring.

## Running Locally

### 1. Start the Haskell Backend
Require [GHC and Cabal](https://www.haskell.org/ghcup/) installed.
```bash
cd backend
cabal run
```
The server will bind to `localhost:8080`.

### 2. View the Frontend
You can open `frontend/index.html` directly in your browser, or serve it via any basic HTTP server:
```bash
cd frontend
npx serve .
```

## Deployment (Vercel)
The project includes a `vercel.json` configured to deploy the frontend as static files.
NOTE: To serve the Haskell backend on Vercel as a Serverless function, a community builder (such as `vercel-haskell`) or an external deployment strategy (like Railway or Render proxy) is typically utilized for the API portion.

Run the Vercel CLI from the root directory:
```bash
vercel deploy --prod
```
