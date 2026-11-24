@echo off
rem Same as start-phone.cmd, but works even when the phone is on a different network
rem (or Windows Firewall blocks the local connection). Slightly slower to load.
set "PATH=%~dp0.tools\node-v24.22.3-win-x64;%PATH%"
cd /d "%~dp0app"
call npx expo start --tunnel ngrok
pause
