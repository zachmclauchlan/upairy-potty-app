@echo off
rem Sign in to your Expo account (needed once, before cloud builds).
set "PATH=%~dp0.tools\node-v24.22.3-win-x64;%~dp0.tools\eas\node_modules\.bin;%PATH%"
cd /d "%~dp0app"
call eas login
echo.
call eas whoami
pause
