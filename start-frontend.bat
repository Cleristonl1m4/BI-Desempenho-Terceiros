@echo off
setlocal
cd /d "%~dp0"

if not exist "package.json" (
  echo Projeto nao encontrado em "%~dp0".
  pause
  exit /b 1
)

call npm run dev
if errorlevel 1 pause
