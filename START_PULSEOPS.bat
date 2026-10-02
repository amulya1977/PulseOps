@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\node_modules" (
  echo Backend packages are missing. Run SETUP.bat first.
  pause
  exit /b 1
)
if not exist "frontend\node_modules" (
  echo Frontend packages are missing. Run SETUP.bat first.
  pause
  exit /b 1
)
start "PulseOps Backend" cmd /k "cd /d \"%~dp0backend\" && npm run dev"
start "PulseOps Frontend" cmd /k "cd /d \"%~dp0frontend\" && npm run dev"
timeout /t 4 /nobreak >nul
start "" http://localhost:5173
exit /b 0
