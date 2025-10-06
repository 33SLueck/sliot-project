// utils/secrets.js
// Hybrid approach: Use Parameter Store in production, env vars locally

const AWS = require('aws-sdk');


// Initialize AWS SSM client only in production
const ssm = process.env.NODE_ENV === 'production' ? new AWS.SSM({
  region: process.env.AWS_REGION || 'eu-central-1'
}) : null;

const parameterCache = new Map();

/**
 * Get secret value from Parameter Store (production) or environment variables (local)
 * @param {string} key - Parameter name (e.g., 'database-password')
 * @param {string} fallback - Fallback value for local development
 * @returns {Promise<string>} Secret value
 */
async function getSecret(key, fallback = null) {
  // Local development: use environment variables
  if (process.env.NODE_ENV !== 'production') {
    return process.env[key.toUpperCase().replace(/-/g, '_')] || fallback;
  }

  // Production: use Parameter Store with caching
  const parameterName = `${process.env.AWS_PARAMETER_STORE_PREFIX || '/sliot-project/'}${key}`;
  
  if (parameterCache.has(parameterName)) {
    return parameterCache.get(parameterName);
  }

  try {
    const result = await ssm.getParameter({
      Name: parameterName,
      WithDecryption: true
    }).promise();
    
    const value = result.Parameter.Value;
    parameterCache.set(parameterName, value);
    return value;
  } catch (error) {
    console.warn(`Failed to get parameter ${parameterName}:`, error.message);
    return fallback;
  }
}

/**
 * Initialize secrets for the application
 * @returns {Promise<Object>} Configuration object
 */
async function initializeSecrets() {
  const config = {
    database: {
      url: await getSecret('database-url', process.env.DATABASE_URL),
      user: await getSecret('database-user', process.env.POSTGRES_USER),
      password: await getSecret('database-password', process.env.POSTGRES_PASSWORD),
      name: await getSecret('database-name', process.env.POSTGRES_DB)
    },
    n8n: {
      authUser: await getSecret('n8n-auth-user', process.env.N8N_BASIC_AUTH_USER),
      authPassword: await getSecret('n8n-auth-password', process.env.N8N_BASIC_AUTH_PASSWORD)
    },
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      cmsUrl: process.env.NEXT_PUBLIC_CMS_URL || 'http://cms:4000',
      n8nUrl: process.env.NEXT_PUBLIC_N8N_URL || 'http://n8n:5678'
    }
  };

  return config;
}

module.exports = {
  getSecret,
  initializeSecrets
};