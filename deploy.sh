#!/bin/bash
set -e

# Pull latest code
git pull origin main

# Stop running containers
docker-compose down --remove-orphans || true

# Pull latest frontend and n8n images
docker pull ghcr.io/33slueck/sliot-project/nextjs:latest
docker pull n8nio/n8n:latest

# Create minimal .env.production
cat > .env.production << EOF
NODE_ENV=production
FRONTEND_IMAGE=ghcr.io/33slueck/sliot-project/nextjs:latest
FRONTEND_PORT=3000
N8N_IMAGE=n8nio/n8n:latest
N8N_PORT=5678
EOF

# Start services
docker-compose --env-file .env.production up -d

# Check status
docker-compose --env-file .env.production ps
