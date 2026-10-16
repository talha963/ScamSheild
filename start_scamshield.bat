@echo off
REM Launcher for ScamShield. Double-click this file.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_scamshield.ps1"
