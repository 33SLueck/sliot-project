#!/bin/bash
# AWS Setup Script - Run this to set up IAM role and Parameter Store

set -e

echo "🔐 Setting up AWS IAM and Parameter Store for Sliot Project..."

# Variables
ROLE_NAME="SliotProjectEC2Role"
POLICY_NAME="SliotProjectParameterStorePolicy"
INSTANCE_PROFILE_NAME="SliotProjectInstanceProfile"

# Create IAM policy
echo "📋 Creating IAM policy..."
aws iam create-policy \
  --policy-name $POLICY_NAME \
  --policy-document file://aws/iam-policy.json \
  --description "Policy for Sliot Project to access Parameter Store" \
  --output text \
  --no-paginate \
  2>/dev/null || echo "Policy $POLICY_NAME already exists"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

# Create IAM role for EC2
echo "👤 Creating IAM role..."
cat > trust-policy.json << EOF
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
  --assume-role-policy-document file://trust-policy.json \
  --description "Role for Sliot Project EC2 instance" \
  --output text \
  --no-paginate \
  2>/dev/null || echo "Role $ROLE_NAME already exists"

# Attach policy to role
echo "🔗 Attaching custom policy to role..."
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn $POLICY_ARN \
  --output text \
  --no-paginate

# Attach AWS managed policy for Systems Manager Session Manager
echo "🔗 Attaching SSM Session Manager policy to role..."
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" \
  --output text \
  --no-paginate

# Attach AWS managed policy for EC2 Instance Connect
echo "🔗 Attaching EC2 Instance Connect policy to role..."
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn "arn:aws:iam::aws:policy/EC2InstanceConnect" \
  --output text \
  --no-paginate

# Create instance profile
echo "📱 Creating instance profile..."
aws iam create-instance-profile \
  --instance-profile-name $INSTANCE_PROFILE_NAME \
  --output text \
  --no-paginate \
  2>/dev/null || echo "Instance profile $INSTANCE_PROFILE_NAME already exists"

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name $INSTANCE_PROFILE_NAME \
  --role-name $ROLE_NAME

# Set up Parameter Store values
echo "🗄️ Setting up Parameter Store parameters..."

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
N8N_PASSWORD=$(openssl rand -base64 16)

aws ssm put-parameter \
  --name "/sliot-project/database-user" \
  --value "postgres" \
  --type "String" \
  --description "Database username" \
  --output text \
  --no-paginate \
  --overwrite

aws ssm put-parameter \
  --name "/sliot-project/database-password" \
  --value "$DB_PASSWORD" \
  --type "SecureString" \
  --description "Database password"

aws ssm put-parameter \
  --name "/sliot-project/database-name" \
  --value "mycms" \
  --type "String" \
  --description "Database name"

aws ssm put-parameter \
  --name "/sliot-project/database-url" \
  --value "postgres://postgres:${DB_PASSWORD}@db:5432/mycms" \
  --type "SecureString" \
  --description "Complete database URL"

aws ssm put-parameter \
  --name "/sliot-project/n8n-auth-user" \
  --value "admin" \
  --type "String" \
  --description "n8n admin username"

aws ssm put-parameter \
  --name "/sliot-project/n8n-auth-password" \
  --value "$N8N_PASSWORD" \
  --type "SecureString" \
  --description "n8n admin password"

# Clean up temp file
rm trust-policy.json

echo "✅ AWS setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Attach the IAM role '$ROLE_NAME' to your EC2 instance:"
echo "   - Go to EC2 Console → Instances → Select your instance"
echo "   - Actions → Security → Modify IAM role"
echo "   - Select: $INSTANCE_PROFILE_NAME"
echo ""
echo "2. Your Parameter Store secrets:"
echo "   - Database password: [SECURE - stored in Parameter Store]"
echo "   - n8n password: [SECURE - stored in Parameter Store]"
echo ""
echo "3. Add these GitHub Secrets:"
echo "   - EC2_HOST: your-ec2-ip"
echo "   - EC2_USERNAME: ubuntu"
echo "   - EC2_SSH_KEY: your-ec2-private-key"