@echo off
setlocal
cd /d "%~dp0"

echo Starting BgUtil PO Token Provider Server...
if not exist third_party\logs mkdir third_party\logs
type nul > third_party\logs\pot-provider.log
cd third_party\bgutil-ytdlp-pot-provider\server
set SERVER_DIR=%CD%
set LOG_FILE=%~dp0third_party\logs\pot-provider.log
cd /d "%~dp0"

powershell -NoProfile -Command "$p = Start-Process -FilePath 'node' -ArgumentList 'build\main.js' -WorkingDirectory '%SERVER_DIR%' -RedirectStandardOutput '%LOG_FILE%' -RedirectStandardError '%LOG_FILE%' -PassThru; Set-Content -Path '%~dp0po-provider.pid' -Value $p.Id"
echo PO Token Provider started.
echo Waiting 5 seconds for provider to initialize...
timeout /t 5 /nobreak > nul

echo.
echo Starting zen-bot...
node main.js

echo.
echo Stopping PO Token Provider...
for /f "usebackq delims=" %%i in ("%~dp0po-provider.pid") do taskkill /PID %%i /F /T 2>nul
del "%~dp0po-provider.pid" 2>nul
endlocal
