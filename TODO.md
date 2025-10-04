# 🚀 SLIoT Project Deployment TODO

## Overview
Complete deployment checklist for the SLIoT project - a secure, cloud-native Next.js + CMS + n8n automation platform on AWS EC2.

---

## ✅ Deployment Steps

### 1. 🔐 Setup AWS Infrastructure
- [ ] Run the AWS setup script locally to create IAM roles, policies, and Parameter Store secrets
- [ ] Execute: `chmod +x aws/setup-aws.sh && ./aws/setup-aws.sh`

**What this does:**
- Creates IAM role `SliotProjectEC2Role`
- Creates IAM policy for Parameter Store access
- Generates secure passwords automatically
- Stores all secrets in Parameter Store

---

### 2. 🔑 Configure GitHub Repository Secrets
- [ ] Add `EC2_HOST` (your EC2 public IP)
- [ ] Add `EC2_USERNAME` (ubuntu)
- [ ] Add `EC2_SSH_KEY` (complete .pem file content)

**Where:** Go to repo Settings → Secrets and variables → Actions

---

### 3. ☁️ Attach IAM Role to EC2 Instance
- [ ] Go to AWS EC2 Console
- [ ] Select your instance → Actions → Security → Modify IAM role
- [ ] Select `SliotProjectInstanceProfile`

**Why:** Enables containers to read secrets securely from Parameter Store

---

### 4. 🖥️ Setup EC2 Instance Environment
- [ ] SSH to your EC2 instance
- [ ] Run setup script:
```bash
curl -O https://raw.githubusercontent.com/your-username/sliot-project/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

**What this installs:** Docker, Docker Compose, AWS CLI, and configures the environment

---

### 5. 🚀 Deploy Application
- [ ] Push code to main branch to trigger GitHub Actions deployment:
```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

**What happens:** GitHub Actions builds containers, pushes to registry, and deploys to EC2

---

### 6. ✅ Verify Production Deployment
- [ ] Check that all services are running on EC2
- [ ] Test frontend access at `http://your-ec2-ip`
- [ ] Verify n8n is accessible via SSH tunnel:
```bash
ssh -L 5678:localhost:5678 ubuntu@your-ec2-ip
```
- [ ] Access n8n at `http://localhost:5678`

---

## 🔒 Security Features

- ✅ **Parameter Store Integration** - No secrets in code or environment files
- ✅ **IAM Role-based Access** - Containers authenticate using EC2 instance role
- ✅ **SSH Tunnel for n8n** - Admin interface only accessible via secure tunnel
- ✅ **Internal Service Communication** - Services communicate on private Docker network

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │      CMS        │    │      n8n        │
│   Frontend      │◄───┤   (Node.js)     │    │   Automation    │
│   Port: 80      │    │   Port: 4000    │    │   Port: 5678    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   Port: 5432    │
                    └─────────────────┘
```

---

## 📋 Pre-requisites

- [ ] AWS CLI configured with appropriate permissions
- [ ] GitHub repository created and code pushed
- [ ] EC2 instance running (Ubuntu 22.04 recommended)
- [ ] Security group allows HTTP (80), HTTPS (443), and SSH (22)

---

## 🆘 Troubleshooting

### If AWS setup fails:
```bash
# Check AWS CLI configuration
aws sts get-caller-identity

# Verify permissions
aws iam list-attached-role-policies --role-name SliotProjectEC2Role
```

### If deployment fails:
- Check GitHub Actions logs in repository
- Verify all secrets are set correctly
- Ensure EC2 instance has IAM role attached

### If services don't start:
```bash
# On EC2 instance
docker compose logs
docker compose ps
```

---

## ✨ Next Steps After Deployment

1. **Configure n8n workflows** via SSH tunnel
2. **Add custom domains** and SSL certificates
3. **Set up monitoring** and logging
4. **Configure backups** for PostgreSQL data
5. **Scale services** as needed

---

*Last updated: October 4, 2025*