@echo off
setlocal
cd /d "%~dp0"
if exist "backend\data\db.json" del /q "backend\data\db.json"
echo PulseOps demo data has been reset.
echo It will be recreated when the backend starts.
pause
