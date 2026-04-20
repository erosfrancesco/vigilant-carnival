#!/bin/bash

# Simple HTTP server to serve the dashboard

PORT=${1:-8080}
DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🌐 Starting HTTP server on port $PORT..."
echo ""
echo "📍 Open in browser: http://localhost:$PORT"
echo "📍 From network: http://$(hostname -I | awk '{print $1}'):$PORT"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$DASHBOARD_DIR"
python3 -m http.server $PORT --bind 0.0.0.0
