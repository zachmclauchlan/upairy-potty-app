@echo off
rem Sign in to your Expo account (needed once, before cloud builds).
set "PATH=%~dp0.tools\node-v24.22.3-win-x64;%PATH%"
cd /d "%~dp0app"
call npx eas login
echo.
call npx eas whoami
pause
