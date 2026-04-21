# Remote Dashboard Deployment

The dashboard can now run on a completely separate machine (PC, laptop, tablet, phone) from the Raspberry Pi server. This guide shows how to deploy the dashboard externally.

## Architecture

```
┌──────────────────────┐
│   Raspberry Pi       │
│  WebSocket Server    │
│  (port 8765)         │
└──────────────────────┘
         ⬆
         ❒ WebSocket
         ❒ (TCP port 8765)
         ⬇
┌──────────────────────────────────────┐
│  External PC                         │
│  ┌──────────────────────────────┐    │
│  │  Web Browser                 │    │
│  │  Dashboard HTML/JS           │    │
│  │  (any port)                  │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

## Quick Start

### 1. **Server Setup (Raspberry Pi)**

```bash
cd server
python3 ws_server.py
```

**Note the Raspberry Pi's IP address** (shown in start output or run):
```bash
hostname -I
# Output: 192.168.1.100
```

### 2. **Dashboard Setup (External PC)**

You have three options to serve the dashboard:

#### Option A: Direct Browser File (Simplest)
1. Copy `dashboard/` to your PC
2. Open in browser: `File → Open File` → select `index.html`
3. Click the 🔧 icon in bottom-right
4. Enter server address: `ws://192.168.1.100:8765` (use your RPi IP)
5. Click "Save & Connect"

#### Option B: Simple HTTP Server
```bash
# On external PC
cd dashboard
python3 -m http.server 8080

# Then open in browser: http://localhost:8080
# Configure server address in the dashboard
```

#### Option C: Cloud Hosting (Advanced)
Upload `dashboard/` folder to any web server:
- Netlify, Vercel, GitHub Pages, etc.
- Open dashboard URL
- Configure server address via the modal

---

## Configuration Methods

### **Method 1: Configuration Modal (Easiest)**

Click the 🔧 icon in bottom-right corner of dashboard and:
- **Connect (Session)** - Temporary, clears on page refresh
- **Save & Connect** - Persistent, saves to localStorage

### **Method 2: URL Parameter**

Use this URL pattern:
```
http://localhost:8080/?server=ws://192.168.1.100:8765
```

Or for any hosted dashboard:
```
https://my-dashboard.netlify.app/?server=ws://192.168.1.100:8765
```

### **Method 3: Direct File (file://)** 

Edit the HTML file before opening:
```javascript
// In the script section, modify getServerUrl():
return "ws://192.168.1.100:8765";  // Your RPi IP
```

---

## Deployment Scenarios

### Scenario 1: Laptop on Same Network

```bash
# On Raspberry Pi
./start.sh

# On Laptop
# Get RPi IP
ping raspberrypi.local   # or: hostname -I on RPi

# Open dashboard with configuration
# Enter: ws://192.168.1.100:8765
```

### Scenario 2: Mobile Phone (WiFi)

1. **Raspberry Pi**: `./start.sh`
2. **Phone**: Get RPi IP from network settings
3. **Phone Browser**: 
   - Copy `dashboard/index.html` or use URL parameter method
   - Configure server: `ws://192.168.1.100:8765`

### Scenario 3: Remote Access (Different Network)

For accessing RPi from outside your home network:

#### Option A: Port Forwarding (Router)
```
Router Port Forward:
  External Port: 8765
  Internal IP: 192.168.1.100
  Internal Port: 8765
```

Then connect from anywhere:
```
Dashboard URL: ?server=ws://YOUR_ROUTER_IP:8765
```

#### Option B: VPN
1. Connect to home VPN from external PC
2. Access RPi on local IP: `ws://192.168.1.100:8765`

#### Option C: Cloud Tunnel (ngrok)
```bash
# On Raspberry Pi with ngrok installed
ngrok tcp 8765

# Get public URL and use in dashboard
Dashboard: ?server=wss://xxx.ngrok.io
```

#### Option D: Secure WebSocket (WSS)
For production remote access, use self-signed SSL:

```bash
# On Raspberry Pi
python3 -c "
import ssl
ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ctx.load_cert_chain('cert.pem', 'key.pem')
"

# Modify ws_server.py:
async with websockets.serve(..., ssl=ssl_context):
    ...

# Then use: wss://YOUR_DOMAIN:8765
```

---

## Multiple Dashboards

Run multiple dashboards on different machines, all connecting to the same server:

```
Raspberry Pi (ws://192.168.1.100:8765)
  ↓
  ├─ Dashboard 1: Laptop (http://localhost:8080)
  ├─ Dashboard 2: Phone (via URL)
  └─ Dashboard 3: Tablet (via URL)
```

All receive real-time updates simultaneously!

---

## Customization

### Change Server Address Programmatically

If hosting the dashboard custom location, modify the getServerUrl function:

**index.html (React):**
```javascript
function getServerUrl() {
    // Check environment variable or config
    if (window.RPI_SERVER_URL) {
        return window.RPI_SERVER_URL;
    }
    
    // Default fallback
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//192.168.1.100:8765`;
}
```

Then in your page's `<head>`:
```html
<script>
    window.RPI_SERVER_URL = 'ws://192.168.1.100:8765';
</script>
```

### Customize Dashboard Appearance

Edit the CSS or React components in the HTML files to match your branding.

---

## Troubleshooting

### Dashboard Won't Connect

**Error: "Connection refused"**
- Check server is running: `ps aux | grep ws_server`
- Verify correct IP address: `hostname -I`
- Check firewall: `sudo ufw allow 8765/tcp`
- Try from same machine first: `ws://localhost:8765`

**Error: "WebSocket is closed"**
- Server crashed - check server logs
- Network connectivity issue - test with ping
- Firewall blocking connection

### Slow Updates

- Check network latency: `ping <rpi-ip>`
- Increase UPDATE_INTERVAL in server/config.py
- Close unnecessary browser tabs

### Can't Access from Phone

- Verify phone on same WiFi network
- Check IP: `hostname -I` on RPi
- Try pinging RPi from phone: `ping 192.168.1.100`
- Firewall might be blocking - see UFW commands above

---

## Security Considerations

⚠️ **This template is for local networks. For external access:**

1. **Use WSS (WebSocket Secure)**
   - Use self-signed or Let's Encrypt certificates
   - Modify ws_server.py to load SSL context

2. **Add Authentication**
   - Implement login/token system
   - Check credentials in handle_client()

3. **Firewall Rules**
   ```bash
   # Only allow specific IPs
   sudo ufw allow from 192.168.1.50 to any port 8765
   
   # Or use VPN instead of port forwarding
   ```

4. **Change Default Port**
   ```python
   # In config.py
   WS_PORT = 9999  # Change from 8765
   ```

5. **Rate Limiting**
   Add message rate limiting to prevent abuse

---

## Examples

### Docker Deployment

Run dashboard in Docker container:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY dashboard/ .
RUN npm install -g http-server
ENV RPI_SERVER_URL=ws://192.168.1.100:8765
CMD ["http-server", "-p", "8080"]
```

```bash
docker build -t rpi-dashboard .
docker run -p 8080:8080 -e RPI_SERVER_URL=ws://192.168.1.100:8765 rpi-dashboard
```

### Systemd Service on Separate PC

```ini
[Unit]
Description=RPi Dashboard Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/vigilant-carnival/dashboard
ExecStart=/usr/bin/python3 -m http.server 8080
Environment="RPI_SERVER_URL=ws://192.168.1.100:8765"
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Summary

✅ Dashboard and server are **completely independent**  
✅ Connect via **any network** (local WiFi or remote)  
✅ **Multiple dashboards** can connect to one server  
✅ Configuration saved **locally in browser**  
✅ No installation required - just **open in browser**

For more help, see [QUICKSTART.md](QUICKSTART.md) and [README.md](README.md).
