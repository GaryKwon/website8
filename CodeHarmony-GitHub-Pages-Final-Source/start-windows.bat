@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20.19 or newer is required. Please install it from https://nodejs.org/
  pause
  exit /b 1
)
if not exist dist\index.html (
  echo Building CodeHarmony...
  call npm install
  if errorlevel 1 goto :failed
  call npm run build
  if errorlevel 1 goto :failed
)
echo Open http://localhost:4173 in your browser.
node scripts/serve.mjs dist
pause
exit /b 0
:failed
echo Could not build CodeHarmony. See README.md.
pause
exit /b 1
