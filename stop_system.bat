@echo off
title Stop Steve's Massage Parlour Server
cd /d "%~dp0"

echo ============================================================
echo   STOPPING STEVE'S MASSAGE PARLOUR SERVER
echo ============================================================
echo.

powershell -NoProfile -Command "
$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conn) {
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Write-Host ('Stopping server process PID ' + $p + '...')
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Write-Host 'Server on port 3000 stopped successfully.' -ForegroundColor Green
} else {
    Write-Host 'No active server was found running on port 3000.' -ForegroundColor Yellow
}
"

echo.
echo Complete.
exit /b 0
