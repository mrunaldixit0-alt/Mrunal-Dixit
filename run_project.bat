@echo off
title Smart Dine Restaurant System Launcher
echo ========================================================
echo       SMART DINE RESTAURANT SYSTEM - STARTUP
echo ========================================================

echo [1/4] Checking and cleaning lingering ports (3000, 3001, 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/4] Starting Backend Server on port 5000...
start "Smart Dine Backend (Port 5000)" cmd /k "cd /d %~dp0backend && node server.js"

echo Waiting 2 seconds for Backend Database initialization...
timeout /t 2 /nobreak >nul

echo [3/4] Starting Frontend Dev Server on port 3000...
start "Smart Dine Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo [4/4] Starting Port 3001 Compatibility Forwarder...
start "Smart Dine Port 3001 Forwarder" cmd /k "cd /d %~dp0 && node forwarder-3001.js"

timeout /t 2 /nobreak >nul

echo.
echo ========================================================
echo  All servers are starting up!
echo.
echo  - Frontend Web App:  http://localhost:3000
echo  - Frontend (Alt):    http://localhost:3001
echo  - Backend API:       http://localhost:5000
echo  - Admin Credentials: admin@gmail.com / Pass@123
echo ========================================================
echo.

start http://localhost:3000
