// Frontend secrets utility for loading AWS Parameter Store values
// Used in production to load Cognito credentials securely

import AWS from 'aws-sdk';

// Initialize AWS SSM client only in production
const ssm = process.env.NODE_ENV === 'production' ? new AWS.SSM({
  region: process.env.AWS_REGION || 'eu-north-1'
}) : null;

const parameterCache = new Map<string, string>();

interface SecretConfig {
  auth: {
    nextauthUrl: string;
    nextauthSecret: string;
    cognitoClientId: string;
    cognitoClientSecret: string;
    cognitoIssuer: string;
  };
  cms: {
    apiUrl: string;
  };
}

/**
 * Get secret value from Parameter Store (production) or environment variables (local)
 * @param key - Parameter name (e.g., 'cognito/client-id')
 * @param fallback - Fallback value for local development
 * @returns Secret value
 */
async function getSecret(key: string, fallback: string | null = null): Promise<string | null> {
  // Local development: use environment variables
  if (process.env.NODE_ENV !== 'production') {
    return process.env[key.toUpperCase().replace(/[/-]/g, '_')] || fallback;
  }

  // Production: use Parameter Store with caching
  const parameterName = `${process.env.AWS_PARAMETER_STORE_PREFIX || '/sliot-project/'}${key}`;
  
  if (parameterCache.has(parameterName)) {
    return parameterCache.get(parameterName) || null;
  }

  if (!ssm) {
    console.error('SSM client not initialized');
    return fallback;
  }

  try {
    const result = await ssm.getParameter({
      Name: parameterName,
      WithDecryption: true
    }).promise();

    const value = result.Parameter?.Value;
    if (value) {
      parameterCache.set(parameterName, value);
      return value;
    }
    return fallback;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to get parameter ${parameterName}:`, errorMessage);
    return fallback;
  }
}

/**
 * Initialize all frontend secrets
 * @returns Configuration object with all secrets
 */
async function initializeFrontendSecrets(): Promise<SecretConfig> {
  try {
    console.log(`🔐 Loading frontend secrets in ${process.env.NODE_ENV} mode...`);

    const config: SecretConfig = {
      auth: {
        nextauthUrl: await getSecret('nextauth/url', process.env.NEXTAUTH_URL || 'http://localhost:3000') || 'http://localhost:3000',
        nextauthSecret: await getSecret('nextauth/secret', process.env.NEXTAUTH_SECRET) || '',
        cognitoClientId: await getSecret('cognito/client-id', process.env.COGNITO_CLIENT_ID) || '',
        cognitoClientSecret: await getSecret('cognito/client-secret', process.env.COGNITO_CLIENT_SECRET) || '',
        cognitoIssuer: await getSecret('cognito/issuer', process.env.COGNITO_ISSUER) || '',
      },
      cms: {
        apiUrl: await getSecret('cms/api-url', process.env.CMS_API_URL || 'http://localhost:4000') || 'http://localhost:4000',
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to initialize frontend secrets:', errorMessage);
    throw error;
  }
}

export {
  getSecret,
  initializeFrontendSecrets
};