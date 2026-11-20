@echo off
cd /d "%~dp0"
echo Starting SpaRE Dev Server...
call npm.cmd run dev
pause
