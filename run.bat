@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" py -3 -m venv .venv
if errorlevel 1 exit /b %errorlevel%
if not exist ".venv\Scripts\uvicorn.exe" .venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 exit /b %errorlevel%
if not exist "frontend\node_modules\vite\bin\vite.js" npm.cmd --prefix frontend install
if errorlevel 1 exit /b %errorlevel%
npm.cmd --prefix frontend run build
if errorlevel 1 exit /b %errorlevel%
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
