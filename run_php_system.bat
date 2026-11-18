@echo off
title Steve's Massage Parlour - PHP/MySQL Web Application (DBIT 226)
cd /d "%~dp0"

echo =======================================================
echo STEVE'S MASSAGE PARLOUR - PHP/MYSQL MANAGEMENT SYSTEM
echo Kenya Methodist University - DBIT 226 Research Project
echo Candidate: Terence Mwaaki (BIT-0-8106-3/2025)
echo =======================================================
echo Starting PHP Development Server...
echo Link: http://localhost:8000
echo.
echo NOTE: Ensure MySQL is running in XAMPP for database access.
echo If using Apache via XAMPP, you can also access:
echo http://localhost/steve_massage/
echo =======================================================
echo.

:: Automatically open browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

:: Start PHP built-in server with XAMPP's PHP
if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" -S localhost:8000
) else (
    php -S localhost:8000
)

pause
