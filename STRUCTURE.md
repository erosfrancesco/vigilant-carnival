# Project Structure Guide

## 📁 Directory Overview

```
vigilant-carnival/
├── README.md                          # Full documentation
├── QUICKSTART.md                      # Quick start guide (start here!)
├── STRUCTURE.md                       # This file
├── start.sh                           # One-command startup script
├── .gitignore                         # Git ignore file
│
├── server/                            # WebSocket Server (Python)
│   ├── ws_server.py                   # ⭐ Main server (recommended)
│   ├── ws_server_minimal.py           # Minimal version (~70 lines)
│   ├── ws_server_gpiozero.py          # Alternative using gpiozero
│   ├── config.py                      # Configuration settings
│   ├── extensions.py                  # Sensor examples & plugins
│   ├── requirements.txt               # Python dependencies
│   └── test_server.py                 # Test script
│
└── dashboard/                         # Frontend (HTML/JavaScript)
    ├── index.html                     # ⭐ React dashboard (default)
    ├── index-preact.html              # Lightweight Preact version
    ├── index-vanilla.html             # Vanilla JS (no dependencies)
    ├── dashboard.css                  # Source CSS with Tailwind
    ├── dashboard-built.css            # Built CSS
    ├── tailwind.config.js             # Tailwind configuration
    ├── package.json                   # Node.js dependencies
    ├── .stylelintrc.json              # CSS linting config
    └── serve.sh                       # HTTP server script
```

## 🚀 Getting Started

### 1. **Install Dependencies (1 minute)**

```bash
# Python dependencies
cd server
pip3 install -r requirements.txt

# Dashboard dependencies
cd ../dashboard
npm install
npm run build-css
```

### 2. **Start Server (Terminal 1)**

```bash
cd server
python3 ws_server.py
```

Output should show:
```
INFO:__main__:WebSocket server running on ws://0.0.0.0:8765
```

### 3. **Serve Dashboard (Terminal 2)**

```bash
cd dashboard
./serve.sh 8080
```

Or manually:
```bash
cd dashboard
python3 -m http.server 8080
```

### 4. **Open Dashboard**

Visit: **http://localhost:8080**

---

## 📚 File Descriptions

### Server Files

| File | Use Case | Size | Notes |
|------|----------|------|-------|
| `ws_server.py` | **Production** | ~200 LOC | Full logging, error handling, serial support |
| `ws_server_minimal.py` | **Minimal setup** | ~70 LOC | Bare essentials, fastest startup |
| `ws_server_gpiozero.py` | **Modern Raspberry Pi OS** | ~100 LOC | Uses `gpiozero` library instead of RPi.GPIO |
| `config.py` | **Configuration** | 20 LOC | Centralized settings |
| `extensions.py` | **Reference** | ~400 LOC | Sensor examples and plugins |
| `test_server.py` | **Verification** | ~50 LOC | Quick test before deployment |
| `requirements.txt` | **Dependencies** | 2 lines | Install with: `pip3 install -r requirements.txt` |

### Dashboard Files

| File | Use Case | Size | Dependencies | Best For |
|------|----------|------|--------------|----------|
| `index.html` | **Full-featured** | 18 KB | React 18 CDN | Complex applications |
| `index-preact.html` | **Lightweight** | 3 KB | Preact 10 CDN | Resource-constrained (RPi Zero) |
| `index-vanilla.html` | **Minimal** | 8 KB | None | Maximum compatibility |
| `serve.sh` | **Development** | 1 KB | Python 3 | Quick local testing |

### Root Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `QUICKSTART.md` | Step-by-step guide |
| `STRUCTURE.md` | This file - directory guide |
| `start.sh` | One-command startup (recommended!) |
| `.gitignore` | Git ignore patterns |

---

## 🔄 How It Works

### Architecture

```
┌─────────────────┐
│   Raspberry Pi  │
│                 │
│ Python Server   │
│  (WebSocket)    │
└────────┬────────┘
         │
         │ TCP/WebSocket
         │ (port 8765)
         │
┌────────┴────────┐
│   Web Browser   │
│                 │
│  React/Preact   │
│   Dashboard     │
└─────────────────┘
```

### Message Flow

1. **Browser connects** to WebSocket server
2. **Server sends initial state** (GPIO pins, serial data)
3. **Server broadcasts updates** every `UPDATE_INTERVAL` seconds
4. **Browser receives updates** and refreshes display in real-time
5. **Browser can send commands** to control pins (if implemented)

### Example WebSocket Message

```json
{
    "type": "state",
    "timestamp": "2024-04-20T12:34:56.789012",
    "gpio": {
        "17": true,
        "27": false,
        "22": true,
        "23": false
    },
    "serial": "Temperature: 25.3°C"
}
```

---

## ⚙️ Configuration

### Server Settings

Edit `server/config.py`:

```python
# WebSocket Settings
WS_HOST = "0.0.0.0"           # Listen on all interfaces
WS_PORT = 8765                # WebSocket port

# GPIO Settings
GPIO_PINS = [17, 27, 22, 23]  # BCM pins to monitor

# Serial Settings
SERIAL_DEVICE = "/dev/ttyACM0"  # Serial port device
SERIAL_BAUDRATE = 9600

# Performance
UPDATE_INTERVAL = 1.0          # Update frequency (seconds)
```

### Dashboard Connection

In dashboard HTML, WebSocket URL is auto-detected:
```javascript
const wsUrl = `${protocol}//${window.location.hostname}:8765`;
```

To connect to different host:
```javascript
const wsUrl = "ws://192.168.1.100:8765";  // Modify this line
```

---

## 🔧 Choosing the Right Version

### Which Server?

- **`ws_server.py`** ← Start here
  - Full-featured, recommended for most users
  - Logging enabled
  - Error handling
  - Optional serial support

- **`ws_server_minimal.py`** - Use if:
  - Running on Raspberry Pi Zero
  - Want absolute minimum code
  - Don't need serial support

- **`ws_server_gpiozero.py`** - Use if:
  - RPi.GPIO doesn't work on your OS
  - Prefer modern `gpiozero` library
  - Newest Raspberry Pi OS versions

### Which Dashboard?

- **`index.html`** ← Default choice
  - Best UX/features
  - React 18 (via CDN)
  - Works great on modern devices

- **`index-preact.html`** - Use if:
  - Running on Raspberry Pi Zero (very limited resources)
  - Want to access dashboard from low-power devices
  - Preact is 6x smaller than React

- **`index-vanilla.html`** - Use if:
  - Need zero dependencies
  - Maximum compatibility
  - Like vanilla JavaScript

All three dashboards connect to the same server!

---

## 📝 Usage Examples

### Quick Start (Easiest - Recommended)

```bash
./start.sh
```

This script automatically:
- Checks dependencies
- Installs if needed
- Shows local + network URLs
- Starts server and waits for connections

### Manual Start (Terminal 1)

```bash
cd server
python3 ws_server.py
```

Manual Start (Terminal 2)

```bash
cd dashboard
python3 -m http.server 8080
```

Then open: **http://localhost:8080**

### From Different Device

1. Get Raspberry Pi IP:
   ```bash
   hostname -I
   # Shows: 192.168.1.100
   ```

2. Open in browser on any device:
   ```
   http://192.168.1.100:8080
   ```

---

## 🛠️ Customization

### Add More Pins

```python
# In server/config.py
GPIO_PINS = [17, 27, 22, 23, 24, 25]  # Add pins 24, 25
```

### Change Update Frequency

```python
# In server/config.py
UPDATE_INTERVAL = 0.5  # Update every 500ms (careful: CPU impact)
```

### Add Custom Sensors

See `server/extensions.py` for examples:
- DHT22 temperature sensor
- HC-SR04 distance sensor
- MPU6050 accelerometer
- PWM motor control

### Modify Dashboard UI

Edit the dashboard HTML files directly:
- Change colors, fonts, layout
- Add new gauges or charts
- Customize GPIO labels

---

## ✅ Verification

### Test WebSocket Server

```bash
cd server
python3 test_server.py
```

Should show:
```
Connected to server!
Init message received...
State updates (5 seconds):
   GPIO17: HIGH, GPIO27: LOW, ...
```

### Check GPIO Pins

```bash
# List GPIO pins
gpio readall
```

### Monitor Server

```bash
# Watch server output
tail -f /tmp/server.log

# Or in separate terminal during startup:
cd server
python3 ws_server.py
```

---

## 📖 Next Steps

1. **Read [QUICKSTART.md](QUICKSTART.md)** - Quick configuration guide
2. **Read [README.md](README.md)** - Complete documentation
3. **Explore [server/extensions.py](server/extensions.py)** - Sensor examples
4. **Check security section** in README before public deployment

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check Python version
python3 --version  # Should be 3.6+

# Check websockets installed
pip3 install websockets

# Check port is free
netstat -tlnp | grep 8765
```

### Can't connect browser

```bash
# Check server is running
ps aux | grep ws_server

# Check firewall
sudo ufw allow 8765/tcp

# Verify IP
hostname -I
```

### GPIO not working

```bash
# Check library
pip3 install RPi.GPIO

# Check permissions
sudo usermod -a -G gpio $USER
# Logout and login

# Test GPIO
gpio readall
```

More help in [QUICKSTART.md Troubleshooting section](QUICKSTART.md#troubleshooting).

---

## 📚 Resources

- **WebSocket Protocol**: https://tools.ietf.org/html/rfc6455
- **Raspberry Pi GPIO**: https://www.raspberrypi.com/documentation/computers/raspberry-pi.html
- **Python WebSockets**: https://websockets.readthedocs.io/
- **React Documentation**: https://react.dev/
- **Preact Guide**: https://preactjs.com/guide/

---

Made with ❤️ for Raspberry Pi enthusiasts.

Questions? Check the full [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md)!
