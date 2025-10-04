#!/bin/bash
# EC2 Setup Script for Sliot Project
# Run this once on your EC2 instance

set -e

echo "🚀 Setting up Sliot Project on EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directory
mkdir -p /home/ubuntu/sliot-project
cd /home/ubuntu/sliot-project

# Clone repository (you'll need to replace with your repo URL)
# git clone https://github.com/your-username/sliot-project.git .

# Set up environment for production
export NODE_ENV=production
export GITHUB_REPOSITORY="your-username/sliot-project"

# Create directories for persistent data
mkdir -p postgres-data
sudo chown -R 999:999 postgres-data

# Set up Parameter Store secrets (run these commands in AWS CLI)
echo "📋 Run these AWS CLI commands to set up Parameter Store:"
echo "aws ssm put-parameter --name '/sliot-project/database-password' --value 'your-secure-password' --type 'SecureString'"
echo "aws ssm put-parameter --name '/sliot-project/n8n-auth-password' --value 'your-n8n-password' --type 'SecureString'"
echo "aws ssm put-parameter --name '/sliot-project/database-url' --value 'postgres://postgres:your-secure-password@db:5432/mycms' --type 'SecureString'"

echo "✅ EC2 setup complete!"
echo "📝 Next steps:"
echo "1. Add GitHub secrets to your repository"
echo "2. Set up Parameter Store values"
echo "3. Push code to trigger deployment"