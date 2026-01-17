# ThreatWatch Packet Capture Setup Script for Windows
# Run this script as Administrator

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ThreatWatch Packet Capture Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Step 1: Checking for tshark..." -ForegroundColor Yellow

$tsharkPath = Get-Command tshark -ErrorAction SilentlyContinue

if ($tsharkPath) {
    Write-Host "tshark is installed" -ForegroundColor Green
    & tshark --version | Select-Object -First 1
} else {
    Write-Host "tshark not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Wireshark:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.wireshark.org/download.html" -ForegroundColor White
    Write-Host "2. Run the installer as Administrator" -ForegroundColor White
    Write-Host "3. Make sure 'TShark' is selected during installation" -ForegroundColor White
    Write-Host "4. Add Wireshark to PATH (usually C:\Program Files\Wireshark)" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Checking Node.js..." -ForegroundColor Yellow

$nodePath = Get-Command node -ErrorAction SilentlyContinue

if ($nodePath) {
    $nodeVersion = & node -v
    Write-Host "Node.js $nodeVersion is installed" -ForegroundColor Green
} else {
    Write-Host "Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js 18 or higher from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Installing npm dependencies..." -ForegroundColor Yellow

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 4: Setting up environment..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env file from template" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Edit .env and add your Supabase credentials:" -ForegroundColor Yellow
    Write-Host "   - SUPABASE_URL" -ForegroundColor White
    Write-Host "   - SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ".env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Listing available network interfaces..." -ForegroundColor Yellow
Write-Host ""

& tshark -D

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file and add your Supabase credentials" -ForegroundColor White
Write-Host "2. Choose a network interface from the list above" -ForegroundColor White
Write-Host "3. Update NETWORK_INTERFACE in .env" -ForegroundColor White
Write-Host "4. Start the service: npm start" -ForegroundColor White
Write-Host ""
Write-Host "Remember to run as Administrator when starting the service!" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
