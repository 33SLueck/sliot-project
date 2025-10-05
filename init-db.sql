-- Database initialization for SLIoT Platform
-- This script runs once when PostgreSQL container starts

-- Create database for n8n automation platform
CREATE DATABASE n8n;
GRANT ALL PRIVILEGES ON DATABASE n8n TO postgres;

-- Create database for CMS (managed by Prisma)
CREATE DATABASE sliot_cms;
GRANT ALL PRIVILEGES ON DATABASE sliot_cms TO postgres;

-- Create dedicated users for better security (optional)
-- Uncomment if you want separate database users

-- CREATE USER n8n_user WITH PASSWORD 'n8n_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n_user;

-- CREATE USER cms_user WITH PASSWORD 'cms_secure_password';  
-- GRANT ALL PRIVILEGES ON DATABASE sliot_cms TO cms_user;