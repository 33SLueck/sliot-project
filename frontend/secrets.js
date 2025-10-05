// Frontend secrets utility for loading AWS Parameter Store values
// Used in production to load Cognito credentials securely

const AWS = require('aws-sdk');

// Initialize AWS SSM client only in production
const ssm = process.env.NODE_ENV === 'production' ? new AWS.SSM({
  region: process.env.AWS_REGION || 'eu-north-1'
}) : null;

const parameterCache = new Map();

/**
 * Get secret value from Parameter Store (production) or environment variables (local)
 * @param {string} key - Parameter name (e.g., 'cognito/client-id')
 * @param {string} fallback - Fallback value for local development
 * @returns {Promise<string>} Secret value
 */
async function getSecret(key, fallback = null) {
  // Local development: use environment variables
  if (process.env.NODE_ENV !== 'production') {
    return process.env[key.toUpperCase().replace(/[/-]/g, '_')] || fallback;
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
    console.error(`Failed to get parameter ${parameterName}:`, error.message);
    return fallback;
  }
}

/**
 * Initialize all frontend secrets
 * @returns {Promise<Object>} Configuration object with all secrets
 */
async function initializeFrontendSecrets() {
  try {
    console.log(`🔐 Loading frontend secrets in ${process.env.NODE_ENV} mode...`);

    const config = {
      auth: {
        nextauthUrl: await getSecret('nextauth/url', process.env.NEXTAUTH_URL || 'http://localhost:3000'),
        nextauthSecret: await getSecret('nextauth/secret', process.env.NEXTAUTH_SECRET),
        cognitoClientId: await getSecret('cognito/client-id', process.env.COGNITO_CLIENT_ID),
        cognitoClientSecret: await getSecret('cognito/client-secret', process.env.COGNITO_CLIENT_SECRET),
        cognitoIssuer: await getSecret('cognito/issuer', process.env.COGNITO_ISSUER),
      },
      cms: {
        apiUrl: await getSecret('cms/api-url', process.env.CMS_API_URL || 'http://localhost:4000'),
      }
    };

    // Set environment variables for NextAuth and other libraries to use
    if (config.auth.nextauthUrl) process.env.NEXTAUTH_URL = config.auth.nextauthUrl;
    if (config.auth.nextauthSecret) process.env.NEXTAUTH_SECRET = config.auth.nextauthSecret;
    if (config.auth.cognitoClientId) process.env.COGNITO_CLIENT_ID = config.auth.cognitoClientId;
    if (config.auth.cognitoClientSecret) process.env.COGNITO_CLIENT_SECRET = config.auth.cognitoClientSecret;
    if (config.auth.cognitoIssuer) process.env.COGNITO_ISSUER = config.auth.cognitoIssuer;
    if (config.cms.apiUrl) process.env.CMS_API_URL = config.cms.apiUrl;

    console.log('✅ Frontend secrets loaded successfully');
    return config;

  } catch (error) {
    console.error('❌ Failed to initialize frontend secrets:', error);
    throw error;
  }
}

module.exports = {
  getSecret,
  initializeFrontendSecrets
};