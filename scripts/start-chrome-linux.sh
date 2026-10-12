#!/bin/bash
PROFILE_DIR="$HOME/.config/chrome-scraper-profile"
mkdir -p "$PROFILE_DIR"

echo "========================================================"
echo "Membuka Chrome dengan Remote Debugging Port 9222 (Linux)..."
echo "========================================================"

google-chrome --remote-debugging-port=9222 --user-data-dir="$PROFILE_DIR" &
echo "Chrome dijalankan di background (port 9222)."
