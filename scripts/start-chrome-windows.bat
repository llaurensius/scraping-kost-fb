@echo off
echo ========================================================
echo Membuka Chrome dengan Remote Debugging Port 9222...
echo ========================================================

set PROFILE_DIR=%LOCALAPPDATA%\Google\Chrome\ScraperProfile
if not exist "%PROFILE_DIR%" mkdir "%PROFILE_DIR%"

echo Menjalankan Proxy Bridge WSL2...
start "WSL-CDP-Bridge" cmd /k python "%~dp0win_cdp_proxy.py"

echo Menjalankan Chrome...
start "Chrome-Scraper" "chrome.exe" --remote-debugging-port=9222 --user-data-dir="%PROFILE_DIR%"

echo Selesai. Jangan tutup jendela WSL-CDP-Bridge.
echo Silakan login ke Facebook Marketplace di Chrome tersebut.
pause
