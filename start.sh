#!/bin/bash

# Raspberry Pi WebSocket Dashboard - Startup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"

echo "🎛️  Raspberry Pi WebSocket Dashboard"
echo "===================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install with: sudo apt install python3"
    exit 1
fi

# Install dependencies if needed
if ! python3 -c "import websockets" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r "$SERVER_DIR/requirements.txt"
fi

# Try to import GPIO (optional)
if python3 -c "import RPi.GPIO" 2>/dev/null; then
    echo "✅ RPi.GPIO found"
else
    echo "⚠️  RPi.GPIO not found - running in simulation mode"
    echo "   To enable GPIO: pip3 install RPi.GPIO"
fi

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "🚀 Starting WebSocket server..."
echo ""
echo "📡 Server: ws://localhost:8765"
echo "📡 Network: ws://$LOCAL_IP:8765"
echo ""
echo "🌐 Dashboard: file://$(pwd)/dashboard/index.html"
echo "🌐 Or with web server: python3 -m http.server -d dashboard 8080"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$SERVER_DIR"
python3 ws_server.py
