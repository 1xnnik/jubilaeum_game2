@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js wurde nicht gefunden.
  pause
  exit /b 1
)
node scripts\game.cjs stop
if errorlevel 1 (
  pause
  exit /b 1
)
exit /b 0
