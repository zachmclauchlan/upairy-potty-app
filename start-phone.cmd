@echo off
rem Starts the UpAiry Potty app so you can open it on your phone in Expo Go.
rem Uses the portable Node 24 in .tools so your system Node is untouched.
set "PATH=%~dp0.tools\node-v24.22.3-win-x64;%PATH%"
cd /d "%~dp0app"
echo.
echo  UpAiry Potty: scan the QR code below with your phone.
echo   iPhone: open the Camera app and point it at the code.
echo   Android: open Expo Go and tap "Scan QR code".
echo  Your phone and this computer must be on the same Wi-Fi.
echo  If it won't connect, close this window and run start-phone-tunnel.cmd instead.
echo.
call npx expo start
pause
