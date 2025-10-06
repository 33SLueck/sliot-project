#!/bin/bash
# Simple deployment script for sliot-project

set -e

# Configuration
ENV=${1:-prod}
COMPOSE_FILE="docker-compose.simple.yml"
ENV_FILE=".env.${ENV}"

echo "🚀 Starting deployment with environment: ${ENV}"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE not found"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment from $ENV_FILE"
export $(grep -v '^#' $ENV_FILE | grep -v '^$' | xargs)

# Load production secrets if in production
if [ "$ENV" = "prod" ]; then
    echo "🔑 Loading production secrets from Parameter Store..."
    
    # Only load if AWS CLI is available and we're in the right environment
    if command -v aws &> /dev/null; then
        export COGNITO_CLIENT_ID=$(aws ssm get-parameter --name '/sliot-project/cognito-client-id' --query 'Parameter.Value' --output text --region eu-north-1 2>/dev/null || echo "")
        export COGNITO_CLIENT_SECRET=$(aws ssm get-parameter --name '/sliot-project/cognito-client-secret' --with-decryption --query 'Parameter.Value' --output text --region eu-north-1 2>/dev/null || echo "")
        export COGNITO_ISSUER=$(aws ssm get-parameter --name '/sliot-project/cognito-issuer' --query 'Parameter.Value' --output text --region eu-north-1 2>/dev/null || echo "")
        export NEXTAUTH_SECRET=$(aws ssm get-parameter --name '/sliot-project/nextauth-secret' --with-decryption --query 'Parameter.Value' --output text --region eu-north-1 2>/dev/null || echo "")
        
        if [[ -n "$COGNITO_CLIENT_ID" && -n "$COGNITO_CLIENT_SECRET" && -n "$COGNITO_ISSUER" && -n "$NEXTAUTH_SECRET" ]]; then
            echo "✅ Successfully loaded Cognito credentials"
        else
            echo "⚠️  Warning: Some Cognito credentials could not be loaded"
        fi
    else
        echo "⚠️  AWS CLI not available, skipping Parameter Store loading"
    fi
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# Pull/build images
if [ "$ENV" = "prod" ]; then
    echo "📥 Pulling production images..."
    docker-compose -f $COMPOSE_FILE pull || echo "⚠️  Some images couldn't be pulled, will try to build"
else
    echo "🔨 Building development images..."
    docker-compose -f $COMPOSE_FILE build
fi

# Start services
echo "🚀 Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 20

# Simple health checks
echo "🏥 Checking service health..."

# Check database
if docker-compose -f $COMPOSE_FILE exec -T db pg_isready -U ${POSTGRES_USER} >/dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
fi

# Check CMS
if curl -f http://localhost:${CMS_PORT}/api/categories >/dev/null 2>&1; then
    echo "✅ CMS is responding"
else
    echo "⚠️  CMS is not yet responding (may need more time)"
fi

# Check Frontend
if curl -f http://localhost:${NEXTJS_PORT} >/dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "⚠️  Frontend is not yet responding (may need more time)"
fi

# Check n8n
if curl -f http://localhost:${N8N_PORT} >/dev/null 2>&1; then
    echo "✅ n8n is responding"
else
    echo "⚠️  n8n is not yet responding (may need more time)"
fi

# Show status
echo ""
echo "📊 Container Status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "🎉 Deployment completed!"
echo "🌐 Services should be available at:"
echo "   Frontend: http://localhost:${NEXTJS_PORT}"
echo "   CMS API:  http://localhost:${CMS_PORT}"
echo "   n8n:      http://localhost:${N8N_PORT} (user: ${N8N_BASIC_AUTH_USER})"

if [ "$ENV" = "prod" ]; then
    echo ""
    echo "🔗 Production URLs:"
    echo "   Frontend: https://sliot.de"
    echo "   n8n:      https://n8n.sliot.de"
fi