#!/bin/bash
# Load AWS Parameter Store values and export as environment variables
# This script retrieves production secrets from AWS Parameter Store for deployment

echo "Loading Parameter Store values from AWS..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI not found. Please install AWS CLI to use this script."
    exit 1
fi

# Load parameters from AWS Parameter Store
export COGNITO_CLIENT_ID=$(aws ssm get-parameter --name '/sliot-project/cognito-client-id' --query 'Parameter.Value' --output text --region eu-north-1 2>/dev/null)
export COGNITO_CLIENT_SECRET=$(aws ssm get-parameter --name '/sliot-project/cognito-client-secret' --with-decryption --query 'Parameter.Value' --output text --region eu-north-1 2>/dev/null)
export COGNITO_ISSUER=$(aws ssm get-parameter --name '/sliot-project/cognito-issuer' --query 'Parameter.Value' --output text --region eu-north-1 2>/dev/null)
export NEXTAUTH_SECRET=$(aws ssm get-parameter --name '/sliot-project/nextauth-secret' --with-decryption --query 'Parameter.Value' --output text --region eu-north-1 2>/dev/null)

# Validate that all parameters were loaded
if [[ -z "$COGNITO_CLIENT_ID" || -z "$COGNITO_CLIENT_SECRET" || -z "$COGNITO_ISSUER" || -z "$NEXTAUTH_SECRET" ]]; then
    echo "Error: Failed to load one or more parameters from AWS Parameter Store."
    echo "Please ensure you have proper AWS credentials configured and the parameters exist."
    exit 1
fi

echo "Successfully loaded parameters:"
echo "COGNITO_CLIENT_ID = $COGNITO_CLIENT_ID"
echo "COGNITO_ISSUER = $COGNITO_ISSUER"
echo "NEXTAUTH_SECRET set (length: ${#NEXTAUTH_SECRET})"
echo "COGNITO_CLIENT_SECRET set (length: ${#COGNITO_CLIENT_SECRET})"

# Export additional required variables
export NEXTAUTH_URL=https://sliot.de

echo ""
echo "Environment variables are now set. You can run:"
echo "docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo ""
echo "Or to run the deployment directly:"
if [ "$1" = "--deploy" ]; then
    echo "Starting production services with Parameter Store values..."
    COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID \
    COGNITO_CLIENT_SECRET=$COGNITO_CLIENT_SECRET \
    COGNITO_ISSUER=$COGNITO_ISSUER \
    NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
fi