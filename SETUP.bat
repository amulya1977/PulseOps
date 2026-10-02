@echo off
setlocal
cd /d "%~dp0"
echo.
echo ========================================
echo   PulseOps - First Time Setup
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js 22.12+ or 24 LTS, then run this file again.
  pause
  exit /b 1
)
node -v
npm -v
echo.
echo Installing backend packages...
call npm --prefix backend install
if errorlevel 1 goto :fail
echo.
echo Installing frontend packages...
call npm --prefix frontend install
if errorlevel 1 goto :fail
echo.
echo Setup completed successfully.
echo Double-click START_PULSEOPS.bat to run the project.
pause
exit /b 0
:fail
echo.
echo Setup failed. Check your internet connection and the error above.
pause
exit /b 1
