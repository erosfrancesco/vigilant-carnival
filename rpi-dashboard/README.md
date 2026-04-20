# Raspberry Pi WebSocket Dashboard

A lightweight template for creating real-time monitoring dashboards on Raspberry Pi using Python WebSocket server and React dashboard.

## Features

✅ **Lightweight WebSocket Server** - Pure Python with asyncio  
✅ **GPIO Monitoring** - Real-time state monitoring of GPIO pins  
✅ **Serial Data** - Receive and display data from serial devices  
✅ **Modern Dashboard** - React-based UI with real-time updates  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Low Resource Usage** - Optimized for Raspberry Pi  

## Project Structure

```
rpi-dashboard/
├── server/
│   ├── ws_server.py          # Main WebSocket server
│   ├── config.py             # Configuration settings
│   └── requirements.txt       # Python dependencies
└── dashboard/
    └── index.html            # React dashboard (standalone)
```

## Installation

### 1. Install Python Dependencies

```bash
cd server
pip install -r requirements.txt
```

**Optional: Raspberry Pi GPIO Support**

On Raspberry Pi, also install:
```bash
pip install RPi.GPIO
# or use gpiozero for newer kernels:
pip install gpiozero
```

**Optional: Serial Support**

For serial data monitoring:
```bash
pip install pyserial
```

### 2. Configure Settings

Edit `server/config.py` to match your setup:

```python
GPIO_PINS = [17, 27, 22, 23]      # Pins to monitor (BCM numbering)
SERIAL_DEVICE = "/dev/ttyACM0"    # Serial port device
UPDATE_INTERVAL = 1.0             # Update frequency (seconds)
```

## Running

### Start the WebSocket Server

```bash
cd server
python3 ws_server.py
```

The server will start on `ws://0.0.0.0:8765`

### Access the Dashboard

1. **Local Access**: Open `file:///path/to/dashboard/index.html` in a browser
2. **Network Access**: Serve with a web server:

```bash
cd dashboard
python3 -m http.server 8080
```

Then open `http://localhost:8080` (or your RPi IP)

## API Reference

### WebSocket Messages

#### Client receives (state update):
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
    "serial": "sensor_data_here"
}
```

#### Client receives (initialization):
```json
{
    "type": "init",
    "timestamp": "2024-04-20T12:34:56.789012",
    "gpio": {
        "17": true,
        "27": false,
        "22": true,
        "23": false
    },
    "pins": [17, 27, 22, 23]
}
```

#### Client can send (request state):
```json
{
    "type": "get_state"
}
```

#### Client can send (ping/keep-alive):
```json
{
    "type": "ping"
}
```

## GPIO Pin Setup

### Using BCM Pin Numbering

This template uses BCM (Broadcom) pin numbering. Here's a reference for common Raspberry Pi GPIO pins:

```
Raspberry Pi 4/3 GPIO Pins (BCM):
Pin  GPIO   Function
  3  GPIO2  I2C SDA
  5  GPIO3  I2C SCL
  7  GPIO4  General Purpose
  8  GPIO17 General Purpose
  9  GPIO27 General Purpose
 10  GPIO22 General Purpose
 11  GPIO23 General Purpose
```

### Setting Up Input Pins

```python
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)  # Pull-down
# or
GPIO.setup(17, GPIO.IN, pull_up_down=GPIO.PUD_UP)    # Pull-up
```

## Serial Port Configuration

To find available serial devices:

```bash
ls /dev/tty* /dev/cu*
```

Common devices:
- `/dev/ttyACM0` - Arduino, CH340
- `/dev/ttyUSB0` - USB cable
- `/dev/ttyAMA0` - Built-in UART (Raspberry Pi)

## Performance Tips

1. **Reduce Update Interval**: Change `UPDATE_INTERVAL` in config.py (careful: too low = CPU spike)
2. **Limit GPIO Pins**: Only monitor pins you need
3. **Use Pull-Up/Pull-Down**: Properly configure pins to reduce noise
4. **Optimize Dashboard**: Disable serial data if not needed
5. **Use Systemd Daemon**: Run server as system service for auto-start

## Running as System Service

Create `/etc/systemd/system/rpi-dashboard.service`:

```ini
[Unit]
Description=Raspberry Pi WebSocket Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/rpi-dashboard/server
ExecStart=/usr/bin/python3 ws_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable rpi-dashboard
sudo systemctl start rpi-dashboard
```

## Troubleshooting

### WebSocket Connection Fails
- Check firewall: `sudo ufw allow 8765/tcp`
- Verify server is running: `ps aux | grep ws_server`
- Check IP address: `hostname -I`

### GPIO Not Working
- Run as root or with GPIO permissions
- Verify pins: `gpio readall`
- Check pull-up/pull-down configuration

### Serial Port Not Found
- List devices: `ls -la /dev/tty*`
- Check permissions: `sudo usermod -a -G dialout pi`
- Verify baud rate matches device

### High CPU Usage
- Increase `UPDATE_INTERVAL`
- Reduce number of GPIO pins monitored
- Close unnecessary browser tabs

## Customization

### Add More Pins

Edit `server/config.py`:
```python
GPIO_PINS = [17, 27, 22, 23, 24, 25]  # Add pin 24 and 25
```

### Add Output Pins (PWM, Relay Control)

Modify `ws_server.py` to handle pin control messages:

```python
elif data.get("type") == "set_pin":
    pin = data.get("pin")
    value = data.get("value")
    if RPI_AVAILABLE:
        GPIO.output(pin, value)
```

### Custom Sensor Integration

Add sensor reading functions and integrate with broadcast loop:

```python
def read_dht_sensor():
    # Read humidity/temperature
    return {"temp": 25.5, "humidity": 60}

# Then include in broadcast message:
message["sensors"] = read_dht_sensor()
```

## License

MIT License - Feel free to use and modify for your projects.

## Support

For issues or questions, check:
- WebSocket logs (enable DEBUG logging)
- Browser console (F12 > Console tab)
- System logs: `journalctl -u rpi-dashboard -f`
