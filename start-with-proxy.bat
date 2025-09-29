@echo off
echo Starting Character Crafter AI (with BFL Proxy Server)
echo.
echo Starting proxy server...
start "BFL Proxy Server" cmd /k "npm run server"
echo.
echo Waiting for proxy server to start...
timeout /t 3 /nobreak >nul
echo.
echo Starting frontend application...
start "Character Crafter AI" cmd /k "npm run dev"
echo.
echo Both services have been started!
echo Frontend app: http://localhost:3000
echo Proxy server: http://localhost:3001
echo.
echo Note: Closing this window will automatically clean up all related processes
echo.
pause

REM Clean up all related processes when window closes
:cleanup
echo.
echo [CLEANUP] Terminating related processes...

REM Clean frontend processes (port 3000)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo [CLEANUP] Terminating frontend process PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

REM Clean proxy server processes (port 3001)  
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo [CLEANUP] Terminating proxy process PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

REM Clean possible Node.js processes
taskkill /FI "WINDOWTITLE eq BFL Proxy Server*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Character Crafter AI*" /F >nul 2>&1

echo [CLEANUP] Cleanup completed!
echo.
