# Quick Start Guide

## Installation (30 secondi)

```bash
# 1. Clone or download this template
cd /tmp
wget https://github.com/your-repo/archive/main.zip
unzip main.zip
cd vigilant-carnival/rpi-dashboard

# 2. Install Python dependencies
pip3 install -r server/requirements.txt

# 3. Optional: Install GPIO support
pip3 install RPi.GPIO
# Or for newer OS:
pip3 install gpiozero
```

## Running

### Option 1: Quick Start (Easiest)

```bash
./start.sh
```

### Option 2: Manual Start

**Terminal 1 - Start WebSocket Server:**
```bash
cd server
python3 ws_server.py
```

**Terminal 2 - Serve Dashboard:**
```bash
cd dashboard
./serve.sh 8080
```

Then open **http://localhost:8080** in your browser.

### Option 3: Remote Dashboard (On Different PC)

**RPi Terminal:**
```bash
cd server
python3 ws_server.py
# Note output: ws://YOUR_RPi_IP:8765
```

**External PC:**
```bash
cd dashboard
python3 -m http.server 8080
# Open http://localhost:8080
```

**In Browser:**
1. Click 🔧 (bottom-right corner)
2. Enter server: `ws://192.168.1.100:8765` (use your RPi IP)
3. Click "Save & Connect"

✅ **That's it!** Dashboard can be on a completely different machine

---

## Configuration

### Change GPIO Pins

Edit `server/config.py`:

```python
GPIO_PINS = [17, 27, 22, 23, 24, 25]  # Add/remove pins
```

### Change Update Frequency

```python
UPDATE_INTERVAL = 0.5  # Update every 500ms (be careful: may spike CPU)
```

### Change Serial Port

```python
SERIAL_DEVICE = "/dev/ttyUSB0"  # Change to your device
SERIAL_BAUDRATE = 115200        # Change if needed
```

## Dashboard Variants

Choose the dashboard that best fits your needs:

- **`index.html`** - Full React (18 KB gzipped) - Most features, good for full apps
- **`index-preact.html`** - Lightweight Preact (3 KB) - For resource-constrained environments
- **`index-vanilla.html`** - Vanilla JavaScript (no dependencies) - Simplest implementation
### PC mock server

- **`mock_server.py`** - Run from `rpi-dashboard/dashboard` to simulate GPIO, serial and sensor data for dashboard testing
All three connect to the same WebSocket server!

## Troubleshooting

### "Connection refused"
```bash
# Check if server is running
ps aux | grep ws_server

# Check port is open
netstat -tlnp | grep 8765

# Check firewall
sudo ufw allow 8765/tcp
```

### "GPIO not found"
```bash
# Install GPIO library
pip3 install RPi.GPIO

# Or use the gpiozero variant:
cd server
python3 ws_server_gpiozero.py
```

### High CPU usage
- Increase `UPDATE_INTERVAL` in config.py
- Reduce number of GPIO pins monitored
- Use Preact dashboard instead of React

### Serial data not showing
- Check device: `ls /dev/tty*`
- Verify baud rate matches device
- Check permissions: `sudo usermod -a -G dialout $USER`
- Restart shell after permission change

## Security Notes

⚠️ **This template is NOT secure for public internet use**

For production:
- Add authentication
- Use WSS (WebSocket Secure) with TLS certificates
- Restrict access with firewall rules
- Run as non-root user

Example with HTTPS:
```python
ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain('cert.pem', 'key.pem')
async with websockets.serve(..., ssl=ssl_context):
    ...
```

## Examples

### Reading Temperature Sensor (DHT22)

```python
# In ws_server.py
def read_dht_sensor():
    try:
        import Adafruit_DHT
        humidity, temperature = Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, 4)
        return {"temp": temperature, "humidity": humidity}
    except:
        return None

# In broadcast_state() message:
message = {
    ...
    "sensors": read_dht_sensor(),
    ...
}
```

### Controlling Output (Relay)

```python
# In ws_server.py
def handle_client(...):
    async for message in websocket:
        data = json.loads(message)
        if data.get("type") == "set_relay":
            pin = data.get("pin")
            value = data.get("value")
            if RPI_AVAILABLE:
                GPIO.setup(pin, GPIO.OUT)
                GPIO.output(pin, value)
```

### Reading Multiple Serial Devices

```python
def read_all_serial_devices():
    devices = {
        "arduino": "/dev/ttyACM0",
        "gps": "/dev/ttyUSB0"
    }
    data = {}
    for name, device in devices.items():
        try:
            ser = serial.Serial(device, 9600, timeout=0.1)
            data[name] = ser.read(100).decode('utf-8', errors='ignore')
            ser.close()
        except:
            pass
    return data
```

## Performance Tips

### For Raspberry Pi Zero / Older Models

1. **Use Preact dashboard** instead of React
2. **Increase UPDATE_INTERVAL** to 2-5 seconds
3. **Reduce GPIO pins** to only what you need
4. **Disable serial** if not needed
5. **Use gpiozero**, it's more efficient

Example optimized config:
```python
GPIO_PINS = [17, 27]  # Only 2 pins
UPDATE_INTERVAL = 5.0  # 5 second updates
# Skip serial reading
```

### Network Optimization

- Use local IP instead of localhost when accessing from another device
- Add message compression (optional, uses more CPU)
- Reduce dashboard refresh rate

## Auto-start on Boot

### Using Systemd (Recommended)

Create `/etc/systemd/system/rpi-dashboard.service`:

```ini
[Unit]
Description=RPi WebSocket Dashboard
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

# Check status
sudo systemctl status rpi-dashboard

# View logs
sudo journalctl -u rpi-dashboard -f
```

### Using Crontab

```bash
crontab -e

# Add this line:
@reboot /home/pi/rpi-dashboard/start.sh > /tmp/dashboard.log 2>&1
```

## Widgets & Data Visualization 📊

The **React dashboard** includes modular widgets for displaying sensor data in real-time.

### Available Widgets

1. **ValueDisplay** - Shows current value + min/max/average
   ```jsx
   <ValueDisplay 
       label="Temperature"
       value={23.5}
       unit="°C"
       min={15.2}
       max={28.3}
       avg={22.1}
   />
   ```

2. **LineChartWidget** - Displays historical data as line chart
   ```jsx
   <LineChartWidget
       label="Temperature (1 hour)"
       data={temperatureHistory}
       timestamps={timestamps}
       color="#667eea"
       yMin={15}
       yMax={30}
       yLabel="°C"
   />
   ```

### Quick Integration Example

```javascript
// In the React dashboard component:
const [temperatureHistory, setTemperatureHistory] = useState([]);
const [timestamps, setTimestamps] = useState([]);

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Extract sensor data from server message
    if (data.sensors?.temperature) {
        setTemperatureHistory(prev => 
            [...prev, data.sensors.temperature].slice(-60)  // Keep last 60 values
        );
        setTimestamps(prev => 
            [...prev, data.timestamp].slice(-60)
        );
    }
};

// Render widget
<LineChartWidget
    label="Temperature"
    data={temperatureHistory}
    timestamps={timestamps}
    color="#667eea"
    yMin={15}
    yMax={30}
/>
```

### Server Setup for Sensors

Use the enhanced server with sensor support:

```bash
# With sensor simulation
cd server
python3 ws_server_enhanced.py

# Or use the original ws_server.py with sensor modifications
python3 ws_server.py
```

**Server sends data in format:**
```json
{
    "type": "state",
    "timestamp": "2024-04-20T12:34:56.789",
    "gpio": {"17": true, "27": false},
    "sensors": {
        "temperature": 23.5,
        "humidity": 65.2,
        "pressure": 1013.25
    },
    "serial": null
}
```

### Adding Real Sensors

Edit server file and replace sample data:

```python
# For DHT22 (temperature/humidity):
import Adafruit_DHT
humidity, temperature = Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, pin=4)

# For BMP280 (pressure):
import board
import adafruit_bmp280
i2c = board.I2C()
sensor = adafruit_bmp280.Adafruit_BMP280_I2C(i2c)
pressure = sensor.pressure

# For distance (HC-SR04):
import RPi.GPIO as GPIO
# Setup GPIO for echo/trigger pins...
```

**See [WIDGETS.md](WIDGETS.md) for complete documentation and more examples.**

## Next Steps

- ✅ Add more sensors to `read_sensors()` function
- ✅ Create custom widgets (gauge, progress bar, table)
- ✅ Store historical data in database
- ✅ Integrate with home automation
- ✅ Deploy to cloud for remote monitoring

Happy monitoring! 🚀
