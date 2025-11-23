#!/bin/bash

# AIQSO Demo API - Cloudflare Tunnel Setup
# Run this script INSIDE the LXC container (141)

set -e

TUNNEL_NAME="aiqso-demo-api"
HOSTNAME="demo-api.aiqso.io"

echo "🌐 Setting up Cloudflare Tunnel for ${HOSTNAME}..."

# Install cloudflared
echo "📦 Installing cloudflared..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb

echo ""
echo "✅ Cloudflared installed!"
echo ""
echo "📋 Next steps (run these commands):"
echo ""
echo "1. Authenticate with Cloudflare:"
echo "   cloudflared tunnel login"
echo ""
echo "2. Create the tunnel:"
echo "   cloudflared tunnel create ${TUNNEL_NAME}"
echo ""
echo "3. Create config file at ~/.cloudflared/config.yml:"
echo "   cat > ~/.cloudflared/config.yml << 'EOF'"
echo "tunnel: <TUNNEL-ID-FROM-STEP-2>"
echo "credentials-file: /root/.cloudflared/<TUNNEL-ID>.json"
echo ""
echo "ingress:"
echo "  - hostname: ${HOSTNAME}"
echo "    service: http://localhost:3001"
echo "  - service: http_status:404"
echo "EOF"
echo ""
echo "4. Route DNS to the tunnel:"
echo "   cloudflared tunnel route dns ${TUNNEL_NAME} ${HOSTNAME}"
echo ""
echo "5. Install as a service:"
echo "   cloudflared service install"
echo ""
echo "6. Start the service:"
echo "   systemctl enable --now cloudflared"
echo ""
echo "7. Check status:"
echo "   systemctl status cloudflared"
echo ""
