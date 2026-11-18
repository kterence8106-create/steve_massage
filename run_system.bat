@echo off
title Steve's Massage Parlor Management System (DBIT 226)
cd /d "%~dp0"

echo =======================================================
echo STEVE'S MASSAGE PARLOR MANAGEMENT SYSTEM
echo DBIT 226 - Terence Mwaaki (BIT-0-8106-3/2025)
echo =======================================================
echo Computer link: http://localhost:3000
echo Phone link:    http://10.33.24.70:3000
echo (Ensure phone and PC are connected to the same Wi-Fi)
echo =======================================================
echo.

:: Automatically open browser after 1 second
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start the Node.js server
node server.js

pause
