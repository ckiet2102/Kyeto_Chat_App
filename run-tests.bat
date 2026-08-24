@echo off
title Kyeto Chat Automated Test Suite Runner
color 0A
echo =======================================================
echo    KYETO CHAT PLATFORM - AUTOMATED TEST SUITE RUNNER
echo =======================================================
echo.
echo Running integration test suite against backend server (http://127.0.0.1:5001)...
echo.

cd /d "%~dp0backend"
node tests/suite.test.js

echo.
echo =======================================================
echo Execution complete. Press any key to exit.
echo =======================================================
pause > nul
