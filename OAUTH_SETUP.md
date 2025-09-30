# OAuth Setup Guide for ShieldAuth

This guide will help you set up Google and GitHub OAuth authentication for your ShieldAuth application.

## Prerequisites

- A Google Cloud Console account
- A GitHub account
- Your ShieldAuth application running locally

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 2. Create OAuth 2.0 Credentials

1. Go to "Credentials" in the left sidebar
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - For development: `http://localhost:5173/auth/callback/google`
   - For production: `https://yourdomain.com/auth/callback/google`
5. Copy the Client ID and Client Secret

### 3. Configure Environment Variables

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
```

## GitHub OAuth Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: ShieldAuth
   - **Homepage URL**: `http://localhost:5173` (for development)
   - **Authorization callback URL**: `http://localhost:5173/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
GITHUB_CLIENT_ID="your-github-client-id-here"
GITHUB_CLIENT_SECRET="your-github-client-secret-here"
```

## Complete Environment Configuration

Your `.env` file should look like this:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Authapp

# Auth.js Configuration
AUTH_SECRET=your-super-secret-auth-key-here-make-it-long-and-random

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# SMTP Configuration (optional)
EMAIL_ID=your.name@gmail.com
APP_PASSWORD=your-google-app-password
```

## Testing OAuth

1. Start your application: `npm run dev`
2. Go to `http://localhost:5173/login`
3. Click "Continue with Google" or "Continue with GitHub"
4. You should be redirected to the OAuth provider's login page
5. After successful authentication, you'll be redirected back to your dashboard

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**

   - Make sure the redirect URI in your OAuth app matches exactly: `http://localhost:5173/auth/callback/google` or `http://localhost:5173/auth/callback/github`

2. **"Client ID not found" error**

   - Verify your environment variables are set correctly
   - Restart your development server after changing environment variables

3. **"OAuth callback error"**
   - Check that your AUTH_SECRET is set and is a long, random string
   - Ensure your database is running and accessible

### Production Deployment

For production deployment:

1. Update the redirect URIs in your OAuth apps to use your production domain
2. Set the `AUTH_URL` environment variable to your production URL
3. Use a secure, randomly generated `AUTH_SECRET`
4. Ensure your database is properly configured for production

## Security Notes

- Never commit your `.env` file to version control
- Use strong, randomly generated secrets
- Regularly rotate your OAuth client secrets
- Monitor your OAuth app usage in the respective developer consoles
