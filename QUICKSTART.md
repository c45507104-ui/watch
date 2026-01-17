# ThreatWatch SOC - Quick Start Guide

Get your real-time network threat detection up and running in minutes!

## What You'll Get

- Real network packet capture using Wireshark/tshark
- Automatic threat detection with GeoIP location tracking
- Real-time visualization in a beautiful web interface
- Threat intelligence integration
- PDF report generation

## Prerequisites

- **Node.js 18+** installed
- **Wireshark/tshark** installed
- **Supabase account** (already configured)
- **Root/Admin permissions** for packet capture

## Quick Setup (5 Minutes)

### Step 1: Setup Packet Capture Service

Navigate to the packet capture service directory:

```bash
cd packet-capture-service
```

**Linux/macOS:**
```bash
sudo bash setup.sh
```

**Windows (PowerShell as Administrator):**
```powershell
.\setup.ps1
```

The setup script will:
- Install tshark (if needed)
- Configure permissions
- Install Node.js dependencies
- Create your `.env` file
- List available network interfaces

### Step 2: Configure Supabase Credentials

Edit `packet-capture-service/.env`:

```bash
nano .env  # or use your favorite editor
```

Add your credentials from the React app's `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
NETWORK_INTERFACE=any
```

### Step 3: Start the Packet Capture Service

**Linux/macOS:**
```bash
sudo npm start
```

**Windows (PowerShell as Administrator):**
```powershell
npm start
```

You should see:
```
🚀 ThreatWatch Packet Capture Service Starting...
📡 Monitoring interface: any
🔗 Connected to Supabase
🎯 Starting tshark capture...
📦 Processing batch of 10 packets...
✅ Inserted 10 packets
```

### Step 4: Start the Web Interface

In a new terminal, from the project root:

```bash
npm install  # if you haven't already
npm run dev
```

### Step 5: Switch to Real Capture Mode

1. Open http://localhost:5173 in your browser
2. Look for the dropdown in the header that says "Simulator Mode"
3. Click and select **"Real Capture Mode"**
4. Watch real network packets appear!

## Verify It's Working

You should see:

1. **Packet Capture Service Terminal**: Messages showing packets being processed
2. **Web Interface**: Real-time packets appearing in the feed
3. **Threat Map**: Geographic locations of packet sources
4. **Stats**: Packet count increasing
5. **Footer**: Shows "Mode: Real Capture"

## Generate Test Traffic

Want to see activity? Generate some network traffic:

```bash
# In a new terminal

# Generate DNS queries
nslookup google.com
nslookup facebook.com
nslookup twitter.com

# Generate HTTP requests
curl http://example.com
curl http://httpbin.org/ip
curl http://jsonplaceholder.typicode.com/posts/1

# Visit websites in your browser
```

You'll see these packets appear in real-time on your dashboard!

## Troubleshooting

### "Permission Denied"
- Run with `sudo` (Linux/macOS) or as Administrator (Windows)

### "tshark not found"
- Install Wireshark: https://www.wireshark.org/download.html
- Windows: Add to PATH (`C:\Program Files\Wireshark`)

### No packets appearing
- Check the correct network interface in `.env`
- Try using `any` as the interface
- Make sure you have network activity
- Check both terminals for errors

### Database errors
- Verify Supabase credentials in `.env`
- Test connection from the React app first
- Check your internet connection

## Filtering Traffic

Want to capture only specific traffic? Edit `.env`:

```env
# Only HTTP/HTTPS
CAPTURE_FILTER="tcp port 80 or tcp port 443"

# Only external traffic
CAPTURE_FILTER="not (net 10.0.0.0/8 or net 172.16.0.0/12 or net 192.168.0.0/16)"

# Specific host
CAPTURE_FILTER="host 192.168.1.100"
```

Restart the capture service after changing filters.

## Switching Between Modes

You can switch between modes anytime:

- **Simulator Mode**: Generates fake traffic (useful for demos)
- **Real Capture Mode**: Captures actual network packets

Just use the dropdown in the web interface header!

## What's Next?

- Check the full setup guide: [PACKET_CAPTURE_SETUP.md](PACKET_CAPTURE_SETUP.md)
- Configure advanced filtering
- Set up as a system service for 24/7 monitoring
- Add AbuseIPDB API key for enhanced threat detection
- Export PDF reports

## Need Help?

1. Check [PACKET_CAPTURE_SETUP.md](PACKET_CAPTURE_SETUP.md) for detailed instructions
2. Review [packet-capture-service/README.md](packet-capture-service/README.md)
3. Check the troubleshooting sections in both documents

## Security Note

Only monitor networks you own or have permission to monitor. Be aware of privacy laws and regulations in your jurisdiction.

Happy threat hunting!
