# ThreatWatch Packet Capture Service

Real-time network packet capture service for ThreatWatch SOC that captures live network traffic using Wireshark/tshark and stores it in Supabase.

## Prerequisites

### 1. Install Wireshark/tshark

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install tshark

# Allow non-root users to capture packets
sudo usermod -a -G wireshark $USER
sudo chmod +x /usr/bin/dumpcap

# Log out and log back in for group changes to take effect
```

#### macOS
```bash
brew install wireshark

# Grant capture permissions
sudo chown root:admin /usr/local/bin/dumpcap
sudo chmod 4750 /usr/local/bin/dumpcap
```

#### Windows
1. Download and install Wireshark from: https://www.wireshark.org/download.html
2. During installation, make sure to install tshark (command-line tools)
3. Add Wireshark to your PATH: `C:\Program Files\Wireshark`
4. Run Command Prompt or PowerShell as Administrator

### 2. Verify tshark Installation

```bash
tshark --version
```

You should see output like:
```
TShark (Wireshark) 4.x.x
```

### 3. Install Node.js

Make sure you have Node.js 18 or higher:
```bash
node --version  # Should be v18.0.0 or higher
```

## Installation

1. Navigate to the packet capture service directory:
```bash
cd packet-capture-service
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Network interface to monitor (use 'any' to monitor all interfaces)
NETWORK_INTERFACE=any

# Optional: Capture filter (BPF syntax)
# Example: CAPTURE_FILTER="tcp port 80 or tcp port 443"
CAPTURE_FILTER=

# Batch size for database inserts
MAX_PACKETS_PER_BATCH=10

# Optional: AbuseIPDB API key for threat intelligence
# Get free API key at: https://www.abuseipdb.com/
ABUSEIPDB_API_KEY=
```

## Finding Your Network Interface

### Linux
```bash
# List all network interfaces
ip link show

# Or use tshark
tshark -D
```

Common interfaces:
- `eth0` - Ethernet
- `wlan0` - WiFi
- `any` - All interfaces

### macOS
```bash
# List all network interfaces
ifconfig

# Or use tshark
tshark -D
```

Common interfaces:
- `en0` - WiFi
- `en1` - Ethernet
- `any` - All interfaces

### Windows
```bash
# List all network interfaces
tshark -D
```

Use the interface number shown (e.g., `1`, `2`, etc.) or the full interface name.

## Running the Service

### Linux/macOS

You need elevated privileges to capture packets:

```bash
# Run with sudo
sudo npm start

# Or if you configured wireshark group (Linux only)
npm start
```

### Windows

Run Command Prompt or PowerShell as Administrator:

```bash
npm start
```

## Capture Filters

You can filter which packets to capture using BPF (Berkeley Packet Filter) syntax:

### Examples:

```bash
# Capture only HTTP/HTTPS traffic
CAPTURE_FILTER="tcp port 80 or tcp port 443"

# Capture only traffic to/from specific IP
CAPTURE_FILTER="host 192.168.1.100"

# Capture only SSH traffic
CAPTURE_FILTER="tcp port 22"

# Capture everything except local traffic
CAPTURE_FILTER="not host 127.0.0.1"

# Capture only external traffic (not private networks)
CAPTURE_FILTER="not (net 10.0.0.0/8 or net 172.16.0.0/12 or net 192.168.0.0/16)"
```

## What Gets Captured

The service captures the following packet information:
- Source and destination IP addresses
- Source and destination ports
- Protocol (TCP, UDP, ICMP, HTTP, HTTPS, DNS, SSH, FTP)
- Packet size
- Timestamp
- GeoIP location (country, coordinates)
- Threat intelligence (malicious IP detection)

## Threat Intelligence

The service automatically checks captured IPs against:
1. Built-in list of known malicious IPs
2. AbuseIPDB API (if API key provided)
3. Suspicious pattern detection

## Monitoring

The service outputs logs showing:
- Number of packets captured
- Batch processing status
- Malicious packets detected
- Database insertion status

Example output:
```
🚀 ThreatWatch Packet Capture Service Starting...
📡 Monitoring interface: any
🔗 Connected to Supabase: https://your-project.supabase.co
🎯 Starting tshark capture...
📦 Processing batch of 10 packets...
✅ Inserted 10 packets
🚨 Found 2 malicious packets!
```

## Troubleshooting

### Permission Denied

**Linux:**
```bash
# Add yourself to wireshark group
sudo usermod -a -G wireshark $USER
# Log out and log back in
```

**macOS/Windows:**
Run with administrator/root privileges

### "tshark: command not found"

Install Wireshark/tshark (see Prerequisites above)

### "Couldn't run /usr/bin/dumpcap in child process"

```bash
# Linux
sudo chmod +x /usr/bin/dumpcap

# macOS
sudo chown root:admin /usr/local/bin/dumpcap
sudo chmod 4750 /usr/local/bin/dumpcap
```

### No packets being captured

1. Check if you're using the correct network interface
2. Make sure you have active network traffic
3. Try using `any` as the interface to monitor all interfaces
4. Check if firewall is blocking tshark

### Database insertion errors

1. Verify your Supabase credentials in `.env`
2. Make sure your Supabase project is accessible
3. Check that RLS policies allow insertions (they should from your current setup)

## Performance Considerations

- The service captures packets in real-time and can be resource-intensive on busy networks
- Use capture filters to reduce load by filtering out unnecessary traffic
- Adjust `MAX_PACKETS_PER_BATCH` to control database write frequency
- The service uses caching for GeoIP and threat lookups to reduce API calls

## Security Notes

- Never capture sensitive data in production environments without proper authorization
- Be aware of privacy and compliance requirements (GDPR, HIPAA, etc.)
- Only monitor networks you own or have explicit permission to monitor
- Consider using capture filters to exclude sensitive traffic (e.g., exclude certain ports/protocols)

## Production Deployment

For production use, consider:
1. Running as a system service (systemd on Linux, launchd on macOS, Windows Service)
2. Implementing log rotation
3. Adding monitoring and alerting
4. Using a more robust threat intelligence service
5. Implementing packet retention policies

### Example systemd service (Linux):

Create `/etc/systemd/system/threatwatch-capture.service`:

```ini
[Unit]
Description=ThreatWatch Packet Capture Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/packet-capture-service
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable threatwatch-capture
sudo systemctl start threatwatch-capture
sudo systemctl status threatwatch-capture
```

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify all prerequisites are installed
3. Ensure proper network permissions
4. Check Supabase connectivity and credentials
