# ThreatWatch SOC - Real Packet Capture Setup Guide

This guide will help you set up real network packet capture for your ThreatWatch SOC application.

## Overview

The ThreatWatch SOC now supports two modes:

1. **Simulator Mode** - Generates simulated network traffic (default, works in browser)
2. **Real Capture Mode** - Captures actual network packets using Wireshark/tshark

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Network                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Network Traffic
                     │
          ┌──────────▼──────────┐
          │  Packet Capture     │
          │  Service (Node.js)  │
          │  + tshark           │
          └──────────┬──────────┘
                     │
                     │ Enriched Packet Data
                     │ (GeoIP + Threat Intel)
                     │
          ┌──────────▼──────────┐
          │   Supabase DB       │
          │   (Postgres)        │
          └──────────┬──────────┘
                     │
                     │ Real-time Updates
                     │
          ┌──────────▼──────────┐
          │   React Frontend    │
          │   (Your Browser)    │
          └─────────────────────┘
```

## Prerequisites

### 1. System Requirements

- **Operating System**: Linux, macOS, or Windows
- **Node.js**: Version 18 or higher
- **Permissions**: Root/Administrator access for packet capture
- **Network**: Active network connection

### 2. Install Wireshark/tshark

#### Ubuntu/Debian Linux
```bash
sudo apt update
sudo apt install tshark

# Allow non-root packet capture
sudo dpkg-reconfigure wireshark-common
# Select "Yes" when asked if non-superusers should be able to capture packets

# Add your user to the wireshark group
sudo usermod -a -G wireshark $USER

# Set permissions
sudo chmod +x /usr/bin/dumpcap

# Log out and back in for changes to take effect
```

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Wireshark
brew install --cask wireshark

# Set permissions
sudo chown root:admin /usr/local/bin/dumpcap
sudo chmod 4750 /usr/local/bin/dumpcap
```

#### Windows
1. Download Wireshark installer from: https://www.wireshark.org/download.html
2. Run the installer as Administrator
3. Make sure to check "Install TShark" during installation
4. Add to PATH: `C:\Program Files\Wireshark`

### 3. Verify Installation

```bash
# Test tshark
tshark --version

# You should see output like:
# TShark (Wireshark) 4.x.x
```

## Setup Instructions

### Step 1: Install Packet Capture Service

Navigate to the packet capture service directory and install dependencies:

```bash
cd packet-capture-service
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Supabase Configuration (from your React app's .env)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Network Interface to monitor
# Use 'any' to monitor all interfaces, or specify one (e.g., 'eth0', 'wlan0', 'en0')
NETWORK_INTERFACE=any

# Optional: Capture Filter (BPF syntax)
# Leave empty to capture all traffic
# Examples:
#   CAPTURE_FILTER="tcp port 80 or tcp port 443"  # HTTP/HTTPS only
#   CAPTURE_FILTER="not host 127.0.0.1"           # Exclude localhost
CAPTURE_FILTER=

# Batch size for database inserts (10-50 recommended)
MAX_PACKETS_PER_BATCH=10

# Optional: AbuseIPDB API Key for enhanced threat detection
# Get free key at: https://www.abuseipdb.com/register
ABUSEIPDB_API_KEY=
```

### Step 3: Find Your Network Interface

You need to know which network interface to monitor:

**Linux:**
```bash
# List all interfaces
ip link show

# Or use tshark
tshark -D
```

**macOS:**
```bash
# List all interfaces
ifconfig

# Or use tshark
tshark -D
```

**Windows:**
```bash
# List all interfaces
tshark -D
```

Common interfaces:
- **Linux**: `eth0` (Ethernet), `wlan0` (WiFi), `any` (all)
- **macOS**: `en0` (WiFi), `en1` (Ethernet), `any` (all)
- **Windows**: Interface numbers (e.g., `1`, `2`) or full names

### Step 4: Start the Packet Capture Service

**Linux/macOS:**

```bash
# Option 1: Run with sudo (easiest)
sudo npm start

# Option 2: If you configured wireshark group (Linux only)
npm start
```

**Windows:**

Open Command Prompt or PowerShell as Administrator:

```bash
cd packet-capture-service
npm start
```

You should see output like:
```
🚀 ThreatWatch Packet Capture Service Starting...
📡 Monitoring interface: any
🔗 Connected to Supabase: https://your-project.supabase.co
🎯 Starting tshark capture...
📦 Processing batch of 10 packets...
✅ Inserted 10 packets
```

### Step 5: Switch Frontend to Real Capture Mode

1. Make sure your React application is running:
   ```bash
   npm run dev
   ```

2. Open the application in your browser

3. In the header, you'll see a dropdown that says "Simulator Mode"

4. Click it and select **"Real Capture Mode"**

5. The application will now display real network packets being captured!

## Understanding the Capture

### What Gets Captured

The service captures:
- Source and destination IP addresses
- Source and destination ports
- Protocol (TCP, UDP, ICMP, HTTP, HTTPS, DNS, SSH, FTP)
- Packet size
- Timestamp
- Geographic location (country, lat/lon)
- Threat intelligence (malicious IP detection)

### Privacy & Security

The service captures packet metadata only, not the actual content. However:

- Only monitor networks you own or have permission to monitor
- Be aware of privacy laws (GDPR, HIPAA, etc.)
- Use capture filters to exclude sensitive traffic
- Never deploy in production without proper authorization

### Filtering Traffic

You can filter which packets to capture using BPF (Berkeley Packet Filter) syntax:

```bash
# Only HTTP/HTTPS
CAPTURE_FILTER="tcp port 80 or tcp port 443"

# Only DNS
CAPTURE_FILTER="udp port 53"

# Only external traffic (exclude private networks)
CAPTURE_FILTER="not (net 10.0.0.0/8 or net 172.16.0.0/12 or net 192.168.0.0/16)"

# Specific host
CAPTURE_FILTER="host 192.168.1.100"

# Exclude localhost
CAPTURE_FILTER="not host 127.0.0.1"
```

## Troubleshooting

### "Permission Denied" Error

You don't have permission to capture packets.

**Solution:**
- Linux/macOS: Run with `sudo` or configure wireshark group
- Windows: Run Command Prompt/PowerShell as Administrator

### "tshark: command not found"

Wireshark/tshark is not installed or not in PATH.

**Solution:**
- Install Wireshark (see Prerequisites above)
- Windows: Add `C:\Program Files\Wireshark` to PATH

### No Packets Being Captured

The interface might be wrong or no traffic is flowing.

**Solution:**
1. Verify the correct interface with `tshark -D`
2. Try using `any` as the interface
3. Generate some network traffic (browse websites, ping servers)
4. Check firewall settings

### "Couldn't run /usr/bin/dumpcap"

Permissions issue with dumpcap executable.

**Solution:**
```bash
# Linux
sudo chmod +x /usr/bin/dumpcap

# macOS
sudo chown root:admin /usr/local/bin/dumpcap
sudo chmod 4750 /usr/local/bin/dumpcap
```

### Database Insertion Errors

Supabase credentials might be wrong or network issues.

**Solution:**
1. Verify SUPABASE_URL and SUPABASE_ANON_KEY in `.env`
2. Test Supabase connection from your browser
3. Check your internet connection
4. Verify RLS policies allow inserts

### High CPU/Memory Usage

Capturing too many packets on a busy network.

**Solution:**
1. Use capture filters to reduce traffic
2. Increase `MAX_PACKETS_PER_BATCH`
3. Monitor a specific interface instead of `any`
4. Capture only specific protocols (HTTP/HTTPS/DNS)

## Advanced Configuration

### Running as a System Service

For production deployments, run the capture service as a background service:

#### Linux (systemd)

Create `/etc/systemd/system/threatwatch-capture.service`:

```ini
[Unit]
Description=ThreatWatch Packet Capture Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/packet-capture-service
Environment=NODE_ENV=production
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable threatwatch-capture
sudo systemctl start threatwatch-capture
sudo systemctl status threatwatch-capture

# View logs
sudo journalctl -u threatwatch-capture -f
```

#### macOS (launchd)

Create `~/Library/LaunchAgents/com.threatwatch.capture.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.threatwatch.capture</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/packet-capture-service/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/tmp/threatwatch-capture.err</string>
    <key>StandardOutPath</key>
    <string>/tmp/threatwatch-capture.out</string>
</dict>
</plist>
```

Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.threatwatch.capture.plist
```

### Enhanced Threat Intelligence

For better threat detection, sign up for a free AbuseIPDB API key:

1. Visit: https://www.abuseipdb.com/register
2. Create an account
3. Generate an API key
4. Add to your `.env` file:
   ```env
   ABUSEIPDB_API_KEY=your_api_key_here
   ```

This provides real-time threat intelligence from a global abuse database.

## Testing Your Setup

### 1. Verify Packet Capture

In the capture service terminal, you should see:
```
📦 Processing batch of 10 packets...
✅ Inserted 10 packets
```

### 2. Check the Frontend

- Open your ThreatWatch SOC application
- Switch to "Real Capture Mode"
- You should see real packets appearing in the feed
- The packet count should increase
- Geographic locations should be shown on the map

### 3. Generate Test Traffic

Create some network activity to test:

```bash
# Generate DNS queries
nslookup google.com
nslookup facebook.com

# Generate HTTP traffic
curl http://example.com
curl http://httpbin.org/ip

# Generate HTTPS traffic (browse websites)
```

## Performance Optimization

### For High-Traffic Networks

If capturing on a very busy network:

1. **Use Specific Filters**: Only capture relevant traffic
   ```env
   CAPTURE_FILTER="tcp port 80 or tcp port 443"
   ```

2. **Increase Batch Size**: Process more packets at once
   ```env
   MAX_PACKETS_PER_BATCH=50
   ```

3. **Monitor Specific Interface**: Don't use `any`
   ```env
   NETWORK_INTERFACE=eth0
   ```

4. **Limit Packet Rate**: In `index.js`, adjust the processing interval

### For Low-Traffic Networks

If you want more frequent updates:

1. **Decrease Batch Size**:
   ```env
   MAX_PACKETS_PER_BATCH=5
   ```

2. **Reduce Processing Interval**: In `index.js`, change the timer from 5000ms to 2000ms

## Security Best Practices

1. **Never capture in production** without proper authorization
2. **Use capture filters** to exclude sensitive data
3. **Secure your .env file** - never commit to version control
4. **Rotate API keys** regularly
5. **Monitor access logs** to Supabase
6. **Implement data retention policies** - delete old packets
7. **Encrypt network traffic** when transmitting capture data
8. **Audit regularly** - review what's being captured

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the packet-capture-service/README.md
3. Verify all prerequisites are installed
4. Check system permissions
5. Review capture service logs for errors

## Next Steps

Once everything is working:

1. Experiment with different capture filters
2. Monitor different network interfaces
3. Analyze the threat intelligence data
4. Export reports using the PDF export feature
5. Set up as a system service for continuous monitoring
6. Implement data retention policies in Supabase

Enjoy real-time network threat monitoring with ThreatWatch SOC!
