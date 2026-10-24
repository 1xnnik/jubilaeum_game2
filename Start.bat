@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Bitte zuerst Node.js 24 von https://nodejs.org installieren.
  pause
  exit /b 1
)
node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major===20&&minor>=19||major===22&&minor>=12||major>=24?0:1)"
if errorlevel 1 (
  echo Bitte Node.js 24 LTS oder neuer von https://nodejs.org installieren.
  pause
  exit /b 1
)
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm wurde nicht gefunden. Bitte Node.js mit npm erneut installieren.
  pause
  exit /b 1
)
if not exist "node_modules\vite\package.json" (
  echo Installiere Abhaengigkeiten. Beim ersten Start ist Internet erforderlich.
  call npm.cmd ci --no-audit --no-fund
  if errorlevel 1 (
    echo Installation fehlgeschlagen.
    pause
    exit /b 1
  )
)
node scripts\game.cjs start
if errorlevel 1 (
  pause
  exit /b 1
)
exit /b 0
