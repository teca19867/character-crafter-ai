@echo off
echo ========================================
echo    Character Crafter AI - Startup Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not detected, please install Node.js first
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js detected
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] First run, installing dependencies...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
    echo.
) else (
    echo [INFO] Dependencies already installed, skipping installation
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo [NOTICE] .env file not detected
    echo [NOTICE] To use Google Gemini API, please configure as follows:
    echo        1. Copy .env.example file to .env
    echo        2. Edit .env file, replace your_google_gemini_api_key_here with your actual API key
    echo        3. Get API key: https://aistudio.google.com/app/apikey
    echo.
    echo [SECURITY REMINDER] Please ensure not to commit .env files containing real API keys to version control
    echo.
)

REM Start development server
echo [INFO] Starting development server...
echo [INFO] Application will open at http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start development server
npm run dev

REM Clean up ports after server stops
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Cleaning up potentially occupied ports...
    REM Clean port 3000 (frontend)
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        echo [CLEANUP] Terminating process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    
    REM Clean port 3001 (proxy server)
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        echo [CLEANUP] Terminating process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    
    echo [CLEANUP] Port cleanup completed
    echo.
    echo [ERROR] Server startup failed
    pause
)
