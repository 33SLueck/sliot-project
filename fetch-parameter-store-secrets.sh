#!/bin/bash
set -e

# Fetch secrets from AWS Parameter Store and write to .env.production
AWS_REGION="eu-north-1"

export COGNITO_CLIENT_ID=$(aws ssm get-parameter --name '/sliot-project/cognito-client-id' --query 'Parameter.Value' --output text --region $AWS_REGION)
export COGNITO_CLIENT_SECRET=$(aws ssm get-parameter --name '/sliot-project/cognito-client-secret' --with-decryption --query 'Parameter.Value' --output text --region $AWS_REGION)
export COGNITO_ISSUER=$(aws ssm get-parameter --name '/sliot-project/cognito-issuer' --query 'Parameter.Value' --output text --region $AWS_REGION)
export NEXTAUTH_SECRET=$(aws ssm get-parameter --name '/sliot-project/nextauth-secret' --with-decryption --query 'Parameter.Value' --output text --region $AWS_REGION)
export NEXTJS_POSTGRES_PASSWORD=$(aws ssm get-parameter --name '/sliot-project/nextjs-postgres-password' --with-decryption --query 'Parameter.Value' --output text --region $AWS_REGION)
export N8N_POSTGRES_PASSWORD=$(aws ssm get-parameter --name '/sliot-project/n8n-postgres-password' --with-decryption --query 'Parameter.Value' --output text --region $AWS_REGION)

cat > .env.production << EOF
COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
COGNITO_CLIENT_SECRET=$COGNITO_CLIENT_SECRET
COGNITO_ISSUER=$COGNITO_ISSUER
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTJS_POSTGRES_PASSWORD=$NEXTJS_POSTGRES_PASSWORD
N8N_POSTGRES_PASSWORD=$N8N_POSTGRES_PASSWORD
EOF

echo "Secrets written to .env.production"
