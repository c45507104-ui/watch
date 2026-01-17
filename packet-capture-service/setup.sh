#!/bin/bash

echo "=========================================="
echo "ThreatWatch Packet Capture Setup"
echo "=========================================="
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script requires root privileges for some operations."
    echo "Please run with sudo: sudo bash setup.sh"
    exit 1
fi

echo "Step 1: Checking for tshark..."

if command -v tshark &> /dev/null; then
    echo "✅ tshark is already installed"
    tshark --version | head -1
else
    echo "❌ tshark not found. Installing..."

    if command -v apt-get &> /dev/null; then
        apt-get update
        DEBIAN_FRONTEND=noninteractive apt-get install -y tshark

        echo "wireshark-common wireshark-common/install-setuid boolean true" | debconf-set-selections
        dpkg-reconfigure -f noninteractive wireshark-common

        if [ ! -z "$SUDO_USER" ]; then
            usermod -a -G wireshark $SUDO_USER
            echo "✅ Added $SUDO_USER to wireshark group"
        fi

        chmod +x /usr/bin/dumpcap
        echo "✅ tshark installed successfully"
    elif command -v yum &> /dev/null; then
        yum install -y wireshark
        if [ ! -z "$SUDO_USER" ]; then
            usermod -a -G wireshark $SUDO_USER
        fi
        chmod +x /usr/bin/dumpcap
        echo "✅ tshark installed successfully"
    else
        echo "❌ Could not detect package manager. Please install Wireshark/tshark manually."
        exit 1
    fi
fi

echo ""
echo "Step 2: Setting up permissions..."

if [ -f "/usr/bin/dumpcap" ]; then
    chmod +x /usr/bin/dumpcap
    echo "✅ Permissions set for dumpcap"
fi

echo ""
echo "Step 3: Checking Node.js..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo "✅ Node.js $(node -v) is installed"
    else
        echo "⚠️  Node.js version is too old. Please upgrade to version 18 or higher."
    fi
else
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo ""
echo "Step 4: Installing npm dependencies..."

if [ ! -z "$SUDO_USER" ]; then
    sudo -u $SUDO_USER npm install
else
    npm install
fi

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "Step 5: Setting up environment..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Supabase credentials:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo ""
else
    echo "✅ .env file already exists"
fi

echo ""
echo "Step 6: Listing available network interfaces..."
echo ""
tshark -D
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your Supabase credentials"
echo "2. Choose a network interface from the list above"
echo "3. Update NETWORK_INTERFACE in .env (or use 'any' for all)"
echo "4. Start the service: sudo npm start"
echo ""
echo "⚠️  Note: You may need to log out and back in for"
echo "   group permissions to take effect, or continue"
echo "   using sudo to run the capture service."
echo ""
