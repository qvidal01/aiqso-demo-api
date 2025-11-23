# AIQSO Demo API - Production Deployment Guide

## Overview
This guide walks you through deploying the AIQSO Demo API to Proxmox LXC 141 with Cloudflare Tunnel.

## Prerequisites
- Proxmox VE server access
- Cloudflare account with aiqso.io domain
- `.env` file with production credentials

## Step 1: Deploy to Proxmox LXC 141

SSH into your Proxmox host and run:

```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/qvidal01/aiqso-demo-api/main/deploy-proxmox.sh
chmod +x deploy-proxmox.sh
./deploy-proxmox.sh
```

This will:
- Create LXC container 141 with Ubuntu 22.04
- Install Node.js 20
- Clone the repository to `/opt/aiqso-demo-api`
- Install dependencies
- Create a systemd service

## Step 2: Configure Environment Variables

Copy your `.env` file to the container:

```bash
# From your Proxmox host
pct push 141 /path/to/your/.env /opt/aiqso-demo-api/.env
```

Or create it directly in the container:

```bash
pct exec 141 -- nano /opt/aiqso-demo-api/.env
```

Required variables:
```bash
# Supabase
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here

# SendGrid
SENDGRID_API_KEY=your_key_here
SENDGRID_FROM_EMAIL=info@aiqso.io
SENDGRID_FROM_NAME=AIQSO

# OpenAI
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini

# Google Calendar
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
GOOGLE_REDIRECT_URI=https://demo-api.aiqso.io/auth/google/callback

# Budget Controls
BUDGET_OPENAI_MONTHLY_LIMIT=10
BUDGET_SENDGRID_DAILY_LIMIT=50
```

## Step 3: Start the API Service

```bash
# Enable and start the service
pct exec 141 -- systemctl enable --now aiqso-demo-api

# Check status
pct exec 141 -- systemctl status aiqso-demo-api

# View logs
pct exec 141 -- journalctl -u aiqso-demo-api -f
```

## Step 4: Get Container IP

```bash
pct exec 141 -- ip addr show eth0 | grep "inet "
```

Test the API locally:
```bash
curl http://<CONTAINER-IP>:3001/health
```

## Step 5: Setup Cloudflare Tunnel

Enter the container:
```bash
pct enter 141
```

Run the Cloudflare setup script:
```bash
cd /opt/aiqso-demo-api
./cloudflare-tunnel-setup.sh
```

Follow the prompts to:
1. Authenticate with Cloudflare
2. Create the tunnel
3. Configure DNS routing to `demo-api.aiqso.io`
4. Install and start the cloudflared service

## Step 6: Verify Production Deployment

Test the public URL:
```bash
curl https://demo-api.aiqso.io/health
curl https://demo-api.aiqso.io/api/automation/services
```

## Troubleshooting

### Service won't start
```bash
pct exec 141 -- journalctl -u aiqso-demo-api -n 50
```

### Check if port 3001 is listening
```bash
pct exec 141 -- ss -tlnp | grep 3001
```

### Restart the service
```bash
pct exec 141 -- systemctl restart aiqso-demo-api
```

### Cloudflare Tunnel issues
```bash
pct exec 141 -- systemctl status cloudflared
pct exec 141 -- journalctl -u cloudflared -f
```

## Updating the Application

```bash
pct exec 141 -- bash -c "cd /opt/aiqso-demo-api && git pull && npm install && systemctl restart aiqso-demo-api"
```

## Monitoring

### View live logs
```bash
pct exec 141 -- journalctl -u aiqso-demo-api -f
```

### Check resource usage
```bash
pct status 141
```

## Security Notes

- The `.env` file contains sensitive credentials - never commit it to git
- The LXC container is unprivileged for security
- Cloudflare Tunnel provides secure access without opening firewall ports
- Consider implementing rate limiting at the Cloudflare level

## Backup

Backup the `.env` file regularly:
```bash
pct exec 141 -- cat /opt/aiqso-demo-api/.env > ~/aiqso-demo-api-env-backup.txt
```

## Next Steps

After deployment, update the frontend to use the production API:
- Edit `aiqso-website/.env.local`
- Change `NEXT_PUBLIC_API_URL` to `https://demo-api.aiqso.io`
- Redeploy the frontend to Vercel/Netlify
