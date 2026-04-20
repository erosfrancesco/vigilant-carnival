# vigilant-carnival 🎛️

A lightweight, production-ready template for building real-time monitoring dashboards on Raspberry Pi using Python WebSocket server and React/Preact frontend.

**Perfect for:**
- 🔌 GPIO pin monitoring
- 📡 Serial device integration
- 📊 Real-time sensor dashboards
- 🚀 IoT projects on Raspberry Pi
- 💻 Embedded system monitoring

## Features

✅ **Lightweight WebSocket Server** - Pure Python with asyncio, ~100 lines minimal version
✅ **GPIO Monitoring** - Real-time state of all pins
✅ **Serial Data** - Receive and display serial port data
✅ **Remote Dashboard** - Run on external PC/phone/tablet easily
✅ **Multiple Dashboards** - React, Preact, or Vanilla JS - all three work
✅ **Responsive UI** - Works on desktop, tablet, mobile
✅ **Low Resource** - Optimized for Raspberry Pi Zero
✅ **Extensible** - Easy to add sensors, controls, logging
✅ **Zero Dependencies** - Optional libraries, falls back to simulation

## Quick Start

```bash
# Install dependencies
pip3 install websockets

# Start server
cd rpi-dashboard/server
python3 ws_server.py

# In another terminal, serve dashboard
cd rpi-dashboard/dashboard
python3 -m http.server 8080
```

Open **http://localhost:8080** in your browser.

## 🌐 Remote Dashboard (On External PC)

The dashboard can run on a **completely separate machine** from the Raspberry Pi:

```bash
# Raspberry Pi: Start server
cd rpi-dashboard/server
python3 ws_server.py
# Note the IP: 192.168.1.100

# External PC: Serve dashboard
cd rpi-dashboard/dashboard
python3 -m http.server 8080

# Browser: Open http://localhost:8080
# Click 🔧 icon → Enter: ws://192.168.1.100:8765
# Click "Save & Connect"
```

**Works on:**
- 💻 PC/Laptop
- 📱 Phone/Tablet (same WiFi)
- ☁️ Cloud (with configuration)
- 🌍 Remote access (with port forwarding/VPN)

## Project Structure

```
rpi-dashboard/
├── server/
│   ├── ws_server.py              # Main WebSocket server
│   ├── ws_server_gpiozero.py     # gpiozero variant
│   ├── ws_server_minimal.py      # Minimal version (~100 lines)
│   ├── config.py                 # Configuration
│   ├── extensions.py             # Sensor examples & extensions
│   └── requirements.txt           # Dependencies
│
├── dashboard/
│   ├── index.html                # React dashboard
│   ├── index-preact.html         # Preact (lightweight)
│   ├── index-vanilla.html        # Vanilla JS (no deps)
│   ├── serve.sh                  # Quick server script
│
├── start.sh                      # One-command startup
├── README.md                     # Full documentation
├── QUICKSTART.md                 # Quick start guide
└── .gitignore
```

## Dashboard Variants

Choose the frontend that fits your needs:

| Dashboard | Size | Dependencies | Best For |
|-----------|------|--------------|----------|
| **React** | 18 KB | React 18 CDN | Full-featured apps |
| **Preact** | 3 KB | Preact 10 CDN | Embedded systems |
| **Vanilla JS** | 8 KB | None | Minimal overhead |

All three connect to the same WebSocket server!

## Server Variants

| Server | LOC | Dependencies | Features |
|--------|-----|--------------|----------|
| **ws_server.py** | ~200 | websockets | Full-featured, logging |
| **ws_server_gpiozero.py** | ~100 | gpiozero | Modern, object-oriented |
| **ws_server_minimal.py** | ~70 | websockets | Bare minimum |

## API

### WebSocket Message Format

**Server → Client (state update):**
```json
{
    "type": "state",
    "timestamp": "2024-04-20T12:34:56.789012",
    "gpio": {"17": true, "27": false, "22": true, "23": false},
    "serial": "sensor_data_here"
}
```

**Client → Server (commands):**
```json
{"type": "ping"}
{"type": "get_state"}
{"type": "set_pin", "pin": 17, "value": true}
```

## Customization

### Add Custom Sensors

Edit `server/extensions.py` - includes examples for:
- DHT22 temperature/humidity
- HC-SR04 ultrasonic distance
- MPU6050 accelerometer/gyroscope
- PWM/servo control
- Data logging

### Modify Dashboard

Edit HTML files to add:
- Custom gauges
- Charts
- Control buttons
- Historical graphs

### Run as System Service

```bash
sudo systemctl enable rpi-dashboard
sudo systemctl start rpi-dashboard
```

See [QUICKSTART.md](QUICKSTART.md#auto-start-on-boot) for full instructions.

## Performance

- **Raspberry Pi Zero**: 1-2% CPU, 20-30 MB RAM
- **Raspberry Pi 4**: < 0.5% CPU, 15-20 MB RAM
- **Update Interval**: Configurable (default 1 second)
- **Max Clients**: 100+ concurrent connections

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check server is running: `ps aux \| grep ws_server` |
| GPIO not found | Install: `pip3 install RPi.GPIO` |
| High CPU usage | Increase UPDATE_INTERVAL in config.py |
| Serial not working | Check device: `ls /dev/tty*` and permissions |

See [QUICKSTART.md](QUICKSTART.md#troubleshooting) for more help.

## Security Notes

⚠️ This template is **not secure for public internet**. For production:
- Add authentication
- Use WSS (WebSocket Secure)
- Restrict firewall access
- Run as non-root user

## Requirements

- Python 3.6+
- Raspberry Pi 2/3/4/Zero/Zero W
- websockets library: `pip3 install websockets`
- (Optional) RPi.GPIO or gpiozero for hardware GPIO

## Installation

**On Raspberry Pi:**

```bash
# Install Python3 and pip
sudo apt update
sudo apt install python3 python3-pip

# Clone this repo
git clone https://github.com/erosfrancesco/vigilant-carnival.git
cd vigilant-carnival/rpi-dashboard

# Install dependencies
pip3 install -r server/requirements.txt

# Optional: GPIO support
pip3 install RPi.GPIO
```

## Documentation

- 📖 [Full README](rpi-dashboard/README.md) - Complete documentation
- ⚡ [Quick Start](rpi-dashboard/QUICKSTART.md) - Get running in 2 minutes
- 🌐 [Remote Dashboard Setup](rpi-dashboard/REMOTE-SETUP.md) - Run on external PC (step-by-step)
- 🚀 [Deployment Guide](rpi-dashboard/DEPLOYMENT.md) - Advanced deployment scenarios
- 🔧 [Structure Guide](rpi-dashboard/STRUCTURE.md) - Directory and file guide

## Examples

See real-world examples in `server/extensions.py`:
- Temperature/humidity sensor (DHT22)
- Distance sensor (HC-SR04)
- Accelerometer (MPU6050)
- PWM motor control
- Servo control
- Data logging to CSV
- System health monitoring

## License

MIT License - Use freely in your projects!

## Contributing

Issues and pull requests welcome! Help improve this template.

---

Made with ❤️ for Raspberry Pi enthusiasts
