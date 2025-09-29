#!/bin/bash

echo "========================================"
echo "   Character Crafter AI - Startup Script"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not detected, please install Node.js first"
    echo "Download: https://nodejs.org/"
    echo
    exit 1
fi

echo "[INFO] Node.js detected"
echo

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "[INFO] First run, installing dependencies..."
    echo
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Dependency installation failed"
        exit 1
    fi
    echo "[SUCCESS] Dependencies installed"
    echo
else
    echo "[INFO] Dependencies already installed, skipping installation"
    echo
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "[NOTICE] .env file not detected"
    echo "[NOTICE] To use Google Gemini API, please configure as follows:"
    echo "       1. Copy .env.example file to .env"
    echo "       2. Edit .env file, replace your_google_gemini_api_key_here with your actual API key"
    echo "       3. Get API key: https://aistudio.google.com/app/apikey"
    echo
    echo "[SECURITY REMINDER] Please ensure not to commit .env files containing real API keys to version control"
    echo
fi

echo "[INFO] Starting development server..."
echo "[INFO] Application will open at http://localhost:3000"
echo "[INFO] Press Ctrl+C to stop the server"
echo
echo "========================================"
echo

# Start development server
npm run dev

# If server stops unexpectedly, show error message
if [ $? -ne 0 ]; then
    echo
    echo "[ERROR] Server startup failed"
    read -p "Press Enter to exit..."
fi
