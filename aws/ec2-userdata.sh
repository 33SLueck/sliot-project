#!/bin/bash
# EC2 User Data Script for SLIoT Project
set -x
exec > >(tee /var/log/user-data.log) 2>&1

echo "Starting SLIoT EC2 setup at $(date)"

# Update system
apt-get update -y

# Install required packages
apt-get install -y \
    docker.io \
    docker-compose \
    awscli \
    git \
    curl \
    wget \
    unzip \
    openssh-server \
    amazon-ssm-agent

# Ensure SSH is properly configured and running
systemctl enable ssh
systemctl enable amazon-ssm-agent
systemctl start ssh
systemctl start amazon-ssm-agent

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Install Docker Compose v2
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create project directory
mkdir -p /home/ubuntu/sliot-project
chown ubuntu:ubuntu /home/ubuntu/sliot-project

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Configure AWS CLI region
sudo -u ubuntu aws configure set region eu-north-1

echo "SLIoT EC2 setup completed at $(date)"

# Test services
systemctl status ssh
systemctl status amazon-ssm-agent
systemctl status docker
docker --version
docker-compose --version

echo "All services configured successfully!"