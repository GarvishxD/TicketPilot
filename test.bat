@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" py -3 -m venv .venv
if errorlevel 1 exit /b %errorlevel%
if not exist ".venv\Scripts\pytest.exe" .venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 exit /b %errorlevel%
.venv\Scripts\python.exe -m pytest -q
