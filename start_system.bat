@echo off
title Steve's Massage Parlour - Management System
cd /d "%~dp0"

echo ============================================================
echo   STEVE'S MASSAGE PARLOUR MANAGEMENT SYSTEM (DBIT 226)
echo   Kenya Methodist University - Terence Mwaaki
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found on your system.
    echo Please install Node.js from https://nodejs.org or run the installer on your Desktop.
    echo.
    pause
    exit /b 1
)

REM Check if server is already running on port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] System server is already active and listening on port 3000.
) else (
    echo [INFO] Starting management system server...
    start "Steve's Massage Server" /min node server.js
    REM Wait 2 seconds for server initialization
    timeout /t 2 /nobreak >nul
)

echo.
echo [INFO] Opening Steve's Massage Parlour in your web browser...
start http://localhost:3000

echo.
echo ============================================================
echo   SYSTEM IS ACTIVE AT: http://localhost:3000
echo ============================================================
echo.
echo You can keep this window open or close it.
echo To completely stop the server, double-click 'stop_system.bat'.
echo.
exit /b 0
