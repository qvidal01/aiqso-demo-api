#!/bin/bash

# AIQSO Demo API - Proxmox LXC Deployment Script
# Run this script on your Proxmox host

set -e

LXC_ID=141
LXC_NAME="aiqso-demo-api"
LXC_HOSTNAME="demo-api"
LXC_STORAGE="local-lvm"
LXC_TEMPLATE="local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
LXC_CORES=2
LXC_MEMORY=2048
LXC_SWAP=512
LXC_DISK_SIZE=8G

echo "🚀 Creating Proxmox LXC ${LXC_ID} for AIQSO Demo API..."

# Create LXC container
pct create ${LXC_ID} ${LXC_TEMPLATE} \
  --hostname ${LXC_HOSTNAME} \
  --cores ${LXC_CORES} \
  --memory ${LXC_MEMORY} \
  --swap ${LXC_SWAP} \
  --rootfs ${LXC_STORAGE}:${LXC_DISK_SIZE} \
  --net0 name=eth0,bridge=vmbr0,firewall=1,ip=dhcp \
  --features nesting=1 \
  --unprivileged 1 \
  --start 1

echo "⏳ Waiting for container to start..."
sleep 10

# Install Node.js 20 and dependencies
echo "📦 Installing Node.js 20 and dependencies..."
pct exec ${LXC_ID} -- bash -c "
  apt-get update && \
  apt-get install -y curl git && \
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
  apt-get install -y nodejs && \
  node --version && \
  npm --version
"

# Clone repository
echo "📥 Cloning repository..."
pct exec ${LXC_ID} -- bash -c "
  cd /opt && \
  git clone https://github.com/qvidal01/aiqso-demo-api.git && \
  cd aiqso-demo-api && \
  npm install
"

# Create systemd service
echo "⚙️  Creating systemd service..."
pct exec ${LXC_ID} -- bash -c "cat > /etc/systemd/system/aiqso-demo-api.service << 'SYSTEMD_EOF'
[Unit]
Description=AIQSO Demo API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aiqso-demo-api
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF
"

echo ""
echo "✅ LXC container ${LXC_ID} created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Get the container IP: pct exec ${LXC_ID} -- ip addr show eth0"
echo "2. Copy .env file: pct push ${LXC_ID} .env /opt/aiqso-demo-api/.env"
echo "3. Start the service: pct exec ${LXC_ID} -- systemctl enable --now aiqso-demo-api"
echo "4. Check status: pct exec ${LXC_ID} -- systemctl status aiqso-demo-api"
echo "5. View logs: pct exec ${LXC_ID} -- journalctl -u aiqso-demo-api -f"
echo ""
echo "🌐 Access the API at: http://<CONTAINER-IP>:3001"
echo ""
