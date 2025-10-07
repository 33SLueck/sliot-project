
#!/bin/bash
set -e

echo "=== Deploy Script Started ==="

# Check for docker-compose.prod.yml
if [ ! -f docker-compose.prod.yml ]; then
	echo "Error: docker-compose.prod.yml not found!"
	exit 1
fi

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Fetch secrets from AWS Parameter Store
echo "Fetching secrets from AWS Parameter Store..."
chmod +x fetch-parameter-store-secrets.sh
./fetch-parameter-store-secrets.sh

# Stop running containers
echo "Stopping running containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Pull latest frontend and n8n images
echo "Pulling latest images..."
docker pull ghcr.io/33slueck/sliot-project/nextjs:latest
docker pull n8nio/n8n:latest

# Start services
echo "Starting services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check status
echo "Service status:"
docker-compose -f docker-compose.prod.yml --env-file .env.production ps

echo "=== Deploy Script Finished ==="
