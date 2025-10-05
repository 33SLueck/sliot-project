# AWS Cognito Setup Guide for SLIoT CMS

## 1. Create Cognito User Pool

1. Go to AWS Console → Amazon Cognito
2. Click "Create user pool"

### Step 1: Configure sign-in experience
- **Authentication providers**: Cognito user pool
- **Cognito user pool sign-in options**: ✅ Email
- **User name requirements**: Allow users to sign in with preferred user name

### Step 2: Configure security requirements
- **Password policy**: Default (or customize as needed)
- **Multi-factor authentication**: Optional (or Required for production)
- **User account recovery**: ✅ Enable self-service account recovery - Recommended

### Step 3: Configure sign-up experience
- **Self-service sign-up**: ✅ Enable self-registration
- **Attribute verification and user account confirmation**: 
  - ✅ Send email verification messages
- **Required attributes**: Email
- **Optional attributes**: given_name, family_name (optional)

### Step 4: Configure message delivery
- **Email provider**: Send email with Cognito (for development)
- For production, consider using SES for better email delivery

### Step 5: Integrate your app
- **User pool name**: `sliot-cms-users`
- **Hosted authentication pages**: ✅ Use the Cognito Hosted UI
- **Domain**: Choose "Use a Cognito domain"
  - Domain prefix: `sliot-cms-auth` (or your preferred unique name)

### Step 6: App client configuration
- **App client name**: `sliot-cms-web-client`
- **Client secret**: ✅ Generate a client secret
- **Authentication flows**: 
  - ✅ ALLOW_USER_SRP_AUTH
  - ✅ ALLOW_REFRESH_TOKEN_AUTH
- **OAuth 2.0 settings**:
  - **Allowed callback URLs**: 
    - `http://localhost:3000/api/auth/callback/cognito` (development)
    - `https://sliot.de/api/auth/callback/cognito` (production)
  - **Allowed sign-out URLs**:
    - `http://localhost:3000` (development)
    - `https://sliot.de` (production)
  - **OAuth grant types**: ✅ Authorization code grant
  - **OAuth scopes**: ✅ email, ✅ openid, ✅ profile

## 2. Note Down Important Values

After creation, note these values for environment variables:

```
COGNITO_USER_POOL_ID=eu-north-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=sliot-cms-auth.auth.eu-north-1.amazoncognito.com
COGNITO_REGION=eu-north-1
```

## 3. Test URLs

- **Hosted UI Login**: `https://sliot-cms-auth.auth.eu-north-1.amazoncognito.com/login?client_id=YOUR_CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:3000/api/auth/callback/cognito`
- **Hosted UI Signup**: `https://sliot-cms-auth.auth.eu-north-1.amazoncognito.com/signup?client_id=YOUR_CLIENT_ID&response_type=code&scope=email+openid+profile&redirect_uri=http://localhost:3000/api/auth/callback/cognito`

## 4. Security Considerations

- Use HTTPS in production
- Implement proper CSRF protection
- Store client secret securely
- Consider implementing rate limiting
- Enable CloudTrail for audit logging