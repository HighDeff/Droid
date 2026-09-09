@echo off
title Unified AI Automation Master Platform
color 0B
echo ========================================================
echo   UNIFIED AI AUTOMATION MASTER PLATFORM (30 TABS)
echo   Master Workflow Orchestrator + 7 Default Agents
echo ========================================================
echo.
echo Starting Unified Master Platform on http://localhost:5173/dashboard ...
echo (Vite will automatically open your default browser)
echo.

cd /d "%~dp0"
npm run dev

pause
