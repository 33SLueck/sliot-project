#!/bin/bash

set -e  # Exit on any error

echo "🚀 Setting up AWS infrastructure for SLIoT Project..."

# Configuration
PROJECT_NAME="sliot-project"
ROLE_NAME="SliotProjectEC2Role"
POLICY_NAME="SliotProjectParameterStorePolicy"
INSTANCE_PROFILE_NAME="SliotProjectInstanceProfile"
AWS_REGION=${AWS_REGION:-us-east-1}

# Generate secure random passwords
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
N8N_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "📋 Configuration:"
echo "  Project: $PROJECT_NAME"
echo "  Region: $AWS_REGION"
echo "  Role: $ROLE_NAME"
echo ""

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

echo "🔐 Creating IAM role..."
# Create trust policy
cat > /tmp/trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --description "Role for SLIoT Project EC2 instances to access Parameter Store" \
  --output table || echo "Role $ROLE_NAME already exists"

echo "📝 Creating IAM policy..."
aws iam create-policy \
  --policy-name $POLICY_NAME \
  --policy-document file://aws/iam-policy.json \
  --description "Policy for SLIoT Project Parameter Store access" \
  --output table || echo "Policy $POLICY_NAME already exists"

echo "🔗 Attaching policy to role..."
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn $POLICY_ARN || echo "Policy already attached"

echo "👤 Creating instance profile..."
aws iam create-instance-profile \
  --instance-profile-name $INSTANCE_PROFILE_NAME \
  --output table || echo "Instance profile $INSTANCE_PROFILE_NAME already exists"

aws iam add-role-to-instance-profile \
  --instance-profile-name $INSTANCE_PROFILE_NAME \
  --role-name $ROLE_NAME || echo "Role already added to instance profile"

echo "🔒 Creating Parameter Store parameters..."

# Database parameters
echo "  - Database user..."
aws ssm put-parameter \
  --name "/${PROJECT_NAME}/database-user" \
  --value "postgres" \
  --type "String" \
  --overwrite \
  --output table > /dev/null

echo "  - Database password..."
aws ssm put-parameter \
  --name "/${PROJECT_NAME}/database-password" \
  --value "$DB_PASSWORD" \
  --type "SecureString" \
  --overwrite \
  --output table > /dev/null

echo "  - Database name..."
aws ssm put-parameter \
  --name "/${PROJECT_NAME}/database-name" \
  --value "sliot" \
  --type "String" \
  --overwrite \
  --output table > /dev/null

echo "  - Database URL..."
aws ssm put-parameter \
  --name "/${PROJECT_NAME}/database-url" \
  --value "postgresql://postgres:$DB_PASSWORD@db:5432/sliot" \
  --type "SecureString" \
  --overwrite \
  --output table > /dev/null

# n8n parameters
echo "  - n8n auth user..."
aws ssm put-parameter \
  --name "/${PROJECT_NAME}/n8n-auth-user" \
  --value "admin" \
  --type "String" \
  --overwrite \
  --output table > /dev/null

echo "  - n8n auth password..."
aws ssm put-parameter \
  --name "/${PROJECT_NAME}/n8n-auth-password" \
  --value "$N8N_PASSWORD" \
  --type "SecureString" \
  --overwrite \
  --output table > /dev/null

echo ""
echo "✅ AWS setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Attach the IAM role '$INSTANCE_PROFILE_NAME' to your EC2 instance"
echo "2. Configure GitHub repository secrets:"
echo "   - EC2_HOST: your-ec2-public-ip"
echo "   - EC2_USERNAME: ubuntu"
echo "   - EC2_SSH_KEY: your-ssh-private-key"
echo "3. Run the EC2 setup script on your instance"
echo "4. Push your code to trigger deployment"
echo ""
echo "🔐 Generated credentials stored securely in Parameter Store"
echo "   - Database password: [SecureString]"
echo "   - n8n password: [SecureString]"

# Cleanup
rm -f /tmp/trust-policy.json

echo "🎉 Setup complete!"