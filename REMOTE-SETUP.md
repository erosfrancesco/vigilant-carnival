# 🌐 Remote Dashboard Setup - Step by Step

Complete guide for running the dashboard on a completely separate PC from the Raspberry Pi.

## Architecture

```
                    WebSocket (TCP 8765)
                           ↕
    ┌─────────────────┐              ┌──────────────────┐
    │ Raspberry Pi    │◄─────────────►│  External PC     │
    │                 │              │                  │
    │ ws_server.py    │              │ Browser          │
    │ (GPIO, Serial)  │              │ Dashboard HTML   │
    └─────────────────┘              └──────────────────┘
    192.168.1.100:8765              Any network location
```

## Prerequisites

- ✅ Raspberry Pi running server (see main README)
- ✅ External PC/laptop/device with browser
- ✅ Both on same WiFi or VPN for local access
- ✅ Python 3 installed (for serving dashboard)

---

## Setup Instructions

### Step 1️⃣: Start Server on Raspberry Pi

**Terminal on RPi:**

```bash
cd /path/to/vigilant-carnival

# Option A: Automatic (recommended)
./start.sh

# Option B: Manual
cd server
python3 ws_server.py
```

You'll see output like:
```
WebSocket server running on ws://0.0.0.0:8765
Monitoring GPIO pins: [17, 27, 22, 23]
```

**Get your Raspberry Pi's IP address:**

```bash
hostname -I
# Output: 192.168.1.100
```

✅ **Note this IP address** - you'll need it for step 3

---

### Step 2️⃣: Copy Dashboard to External PC

Copy the `dashboard/` folder to your external PC:

**Option A: Direct File Copy**
```bash
# Copy dashboard folder to your PC
cp -r dashboard/ ~/MyDashboard/
```

**Option B: Clone Repository**
```bash
git clone https://github.com/erosfrancesco/vigilant-carnival.git
cd vigilant-carnival
```

---

### Step 3️⃣: Serve Dashboard

**On External PC:**

```bash
cd dashboard

# Start simple HTTP server
python3 -m http.server 8080
```

Output:
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

---

### Step 4️⃣: Open Dashboard in Browser

**On External PC Browser:**

Open: **http://localhost:8080**

You'll see the dashboard UI but status will show "Disconnected"

---

### Step 5️⃣: Configure Server Address

**In the Dashboard:**

1. Click the **🔧** icon (bottom-right corner)
2. A modal box appears with "Server Configuration"
3. In the text field, enter your Raspberry Pi's address:
   ```
   ws://192.168.1.100:8765
   ```
   
   ⚠️ Replace `192.168.1.100` with your actual RPi IP from Step 1

4. Choose connection mode:
   - **"Connect (Session)"** - Works for this browser session only
   - **"Save & Connect"** - Saves to browser storage for next visit
   - **"Reset"** - Back to default (localhost)

5. Click the button

✅ **Status should change to "Connected"** with green indicator

---

## Verification ✅

If you see:
- 🟢 **Green indicator** - Connected successfully!
- GPIO pins showing **HIGH/LOW** - Server is sending data
- Serial data updating - Working as expected

### Troubleshooting

**Not connecting?**

```bash
# Verify server is running on RPi
ps aux | grep ws_server

# Check network connectivity
ping 192.168.1.100

# Verify firewall
sudo ufw allow 8765/tcp

# Test locally first (same machine)
# Use: ws://localhost:8765
```

---

## Advanced Configuration

### URL Parameter Method

Share a link with pre-configured server:

```
http://localhost:8080/?server=ws://192.168.1.100:8765
```

Browser will auto-connect on load.

### Mobile Phone

1. Phone must be on **same WiFi** as RPi
2. Open browser and navigate to:
   ```
   http://192.168.1.50:8080
   ```
   (Replace `192.168.1.50` with your PC IP)

3. Click 🔧 and enter RPi address:
   ```
   ws://192.168.1.100:8765
   ```

### Cloud/Hosted Dashboard

Upload dashboard folder to:
- Netlify
- Vercel
- GitHub Pages
- Your own web server

Then use URL parameter method:
```
https://my-dashboard.netlify.app/?server=ws://192.168.1.100:8765
```

---

## Multiple Dashboards

Create multiple monitoring stations:

```
Server (ws://192.168.1.100:8765)
  ↓
  ├─ Dashboard 1: Laptop
  ├─ Dashboard 2: Desktop
  └─ Dashboard 3: Phone
```

All receive **real-time updates simultaneously**

---

## Remote Access (Outside Home Network)

### Option A: Port Forwarding (Router)

1. **Router Settings:**
   - Forward external port 8765 → internal 192.168.1.100:8765

2. **Find your external IP:**
   ```bash
   # On RPi
   curl -s ifconfig.me
   # Output: 203.0.113.45
   ```

3. **Dashboard URL:**
   ```
   http://dashboard-pc:8080/?server=ws://203.0.113.45:8765
   ```

### Option B: VPN

1. Connect external devices to **home VPN**
2. Access RPi on local IP:
   ```
   ws://192.168.1.100:8765
   ```

3. More secure than port forwarding

### Option C: ngrok Tunnel

```bash
# On RPi
pip3 install pyngrok
python3 -c "
from pyngrok import ngrok
public_url = ngrok.connect(8765)
print(f'Public URL: {public_url}')
" &
# Keep this running
```

Then from anywhere:
```
Dashboard: ws://YOUR_NGROK_URL
```

### Option D: Reverse SSH Tunnel

```bash
# On external PC
ssh -R 8765:localhost:8765 pi@raspberrypi.local
```

---

## Real-World Scenarios

### Scenario 1: Monitoring Your Raspberry Pi from Laptop

```bash
# RPi (in garage/basement)
./start.sh

# Laptop (in office)
cd dashboard
python3 -m http.server 8080
# Open http://localhost:8080
# Configure: ws://192.168.1.100:8765
```

✅ Perfect for:
- Monitoring grow lights from bedroom
- Checking sensors while working
- Displaying on TV via Chromecast

---

### Scenario 2: Mobile Monitoring (Same WiFi)

```bash
# RPi
python3 server/ws_server.py

# Access from phone browser
http://laptop-ip:8080
# or copy index.html to phone directly
```

✅ Perfect for:
- Checking status on the go
- Presenting to clients
- Remote monitoring at same location

---

### Scenario 3: Public Monitoring (Remote)

For sharing with others remotely:

1. **Set up HTTPS dashboard** (self-signed cert or Let's Encrypt)
2. **Use secure WebSocket (wss://)**
3. **Add authentication**
4. **Use port forwarding or ngrok**

See [DEPLOYMENT.md](DEPLOYMENT.md) for security setup.

---

## Environment Variables (For Automation)

Create dashboard launcher script:

```bash
#!/bin/bash
# start-dashboard.sh

RPI_IP="192.168.1.100"
DASHBOARD_PORT="8080"

echo "Starting dashboard..."
echo "Open: http://localhost:$DASHBOARD_PORT"
echo "Server: ws://$RPI_IP:8765"

# Append server URL to HTML before serving
cd dashboard
echo "<script>window.RPI_SERVER_URL = 'ws://$RPI_IP:8765';</script>" | \
  cat - index.html > index-configured.html

python3 -m http.server $DASHBOARD_PORT &

# Open browser
sleep 2
xdg-open "http://localhost:$DASHBOARD_PORT/?server=ws://$RPI_IP:8765"
```

---

## Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY dashboard/ .
RUN npm install -g http-server
EXPOSE 8080
CMD ["http-server", "-p", "8080", "--cors"]
```

**Run:**

```bash
docker build -t rpi-dashboard .
docker run -p 8080:8080 rpi-dashboard

# Access: http://localhost:8080
# Configure: ws://192.168.1.100:8765 in browser
```

---

## Security Checklist

For public/remote deployments:

- [ ] Use **WSS (wss://)** not **WS**
- [ ] Add **authentication** to server
- [ ] Use **firewall rules** (UFW on RPi)
- [ ] Change **default port 8765**
- [ ] Use **VPN** instead of port forwarding when possible
- [ ] Keep **server updated**
- [ ] Monitor **access logs**
- [ ] Use **HTTPS** for dashboard
- [ ] Implement **rate limiting**
- [ ] Regular **security audits**

See [DEPLOYMENT.md](DEPLOYMENT.md#security-considerations) for details.

---

## Troubleshooting

### Connection Problems

| Issue | Solution |
|-------|----------|
| "Connection refused" | Check server running: `ps aux \| grep ws_server` |
| "Wrong IP?" | Get correct IP: `hostname -I` on RPi |
| "Firewall blocks" | Run: `sudo ufw allow 8765/tcp` |
| "Browser can't resolve" | Use IP instead of hostname |

### Dashboard Issues

| Issue | Solution |
|-------|----------|
| No data showing | Server not sending data - check logs |
| Page keeps refreshing | Try different dashboard version (React/Preact/Vanilla) |
| Slow updates | Increase UPDATE_INTERVAL in config.py |
| High CPU usage | Reduce GPIO pins monitored |

### Network Issues

```bash
# Test connectivity from PC
ping 192.168.1.100

# Test WebSocket port
nc -zv 192.168.1.100 8765

# Check firewall
sudo ufw status
sudo ufw allow 8765/tcp
```

---

## Summary

✅ **Complete Separation** - Dashboard and server work independently  
✅ **Easy Configuration** - Click 🔧 icon to change server  
✅ **Flexible Deployment** - Local, cloud, or remote  
✅ **Multiple Dashboards** - Many clients, one server  
✅ **No Installation** - Just open HTML or serve HTTP  

**Most Common Setup:**
1. `./start.sh` on RPi
2. `python3 -m http.server 8080` on PC
3. Open browser, click 🔧, enter RPi IP
4. Done! ✨

Questions? See [DEPLOYMENT.md](DEPLOYMENT.md) or [README.md](README.md).
