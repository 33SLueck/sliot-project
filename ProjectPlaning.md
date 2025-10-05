# Sliot Project – Architektur & Setup Übersicht

## 1. Secrets & Environment

- **AWS Systems Manager Parameter Store** wird genutzt, um alle sensiblen Daten zu speichern:
  - Datenbank-URLs
  - API Keys
  - JWT Secrets
- **IAM-Rolle** für die EC2-Instance:
  - Container/Node.js-App kann Parameter Store direkt auslesen
  - Keine Secrets im Repo oder auf Host-Dateien
- Vorteil:
  - Sichere Verwaltung
  - Kein Hardcoding
  - professioneller Umgang mit Cloud-Secrets

## 2. Docker Setup 

- **Services innerhalb von Docker Compose:**
  - **Next.js**: öffentlich auf Ports 80/443
  - **PostgreSQL**: intern, nur für Next.js erreichbar
  - **n8n**: intern, API-Aufrufe über Next.js
- **Netzwerk:** internes Docker-Netzwerk `sliot-net`
- **Ports nach außen:**
  - 80 → HTTP
  - 443 → HTTPS
- **Nginx:** EC2, kann HTTP/HTTPS Traffic zu Next.js Container weiterleiten
- Vorteile:
  - Self-contained, einfach zu deployen
  - Services können intern sicher kommunizieren

## 3. n8n Zugriff

- **Admin Dashboard**
  - Läuft nur intern im Container (Port 5678)
  - Zugriff **nur über SSH-Tunnel**:
    ```bash
    ssh -L 5678:localhost:5678 ubuntu@<ip>
    ```
  - Browser → `http://localhost:5678`
- **Next.js Integration**
  - Next.js API-Routen sprechen n8n REST API direkt über Container-Netzwerk an:
    ```js
    fetch('http://n8n:5678/rest/workflows/1/run', {...})
    ```
  - Vorteil: Admin UI bleibt sicher, Workflows können trotzdem automatisiert gesteuert werden

## 4. CI/CD (GitHub Actions)

- Deployment:
  - Code wird auf GitHub gepusht
  - Actions bauen Container und deployen auf EC2
  - Secrets über GitHub Actions → auf EC2 oder Container gesetzt
- Vorteil:
  - Automatisches, sicheres Deployment
  - Keine Secrets im Repository

---

✅ **Ergebnis:**
    - Sicheres, modular aufgebautes Portfolio-Projekt
    - Cloud-native Secrets-Verwaltung (Parameter Store + IAM)
    - Docker Multi-Service Setup
    - Sichere Admin UI Nutzung über SSH-Tunnel

---

## 🎯 Deployment Setup Checklist

### **1. 🔐 GitHub Repository Secrets**
Go to your repo: `Settings` → `Secrets and variables` → `Actions`

```bash
EC2_HOST=your-ec2-public-ip
EC2_USERNAME=ubuntu
EC2_SSH_KEY=-----BEGIN RSA PRIVATE KEY-----
[your complete .pem file content]
-----END RSA PRIVATE KEY-----
```

### **2. ☁️ AWS Setup** 
Run this once from your local machine:

```bash
# Make script executable
chmod +x aws/setup-aws.sh

# Run AWS setup (creates IAM role + Parameter Store)
./aws/setup-aws.sh
```

**This script will:**
- ✅ Create IAM role `SliotProjectEC2Role`
- ✅ Create IAM policy for Parameter Store access
- ✅ Generate secure passwords automatically
- ✅ Store all secrets in Parameter Store

### **3. 🖥️ EC2 Instance Setup**

**Step 1: Attach IAM Role**
- Go to EC2 Console → Select your instance
- Actions → Security → Modify IAM role
- Select: `SliotProjectInstanceProfile`

**Step 2: Run setup script on EC2**
```bash
# SSH to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run setup
curl -O https://raw.githubusercontent.com/your-username/sliot-project/main/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### **4. 🚀 Deploy**
```bash
# Just push to main branch - GitHub Actions handles the rest!
git add .
git commit -m "Initial deployment setup"
git push origin main
```

## 🔒 **Security Flow**

**Local Development:**
- Uses `.env` file (no AWS needed)

**Production:**
- Container reads from Parameter Store using IAM role
- No secrets in environment variables or config files
- Automatic fallback to env vars if Parameter Store unavailable

## 📊 **Parameter Store Values Created**

The setup script automatically creates:
- `/sliot-project/database-user`
- `/sliot-project/database-password` (SecureString)
- `/sliot-project/database-name`
- `/sliot-project/database-url` (SecureString)
- `/sliot-project/n8n-auth-user`
- `/sliot-project/n8n-auth-password` (SecureString)

## ✅ **Deployment Result**

1. **AWS Setup** → IAM role + Parameter Store ready
2. **GitHub Secrets** → CI/CD pipeline can deploy to EC2
3. **EC2 Role** → Containers can read secrets securely
4. **Push Code** → Automatic build and deployment!
The frontend will be accessible at http://localhost:8080 for local testing!
# Option 1: Current setup (implicit dev mode)
docker compose up -d

# Option 2: Explicit dev mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
