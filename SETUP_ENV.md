# Environment Setup Guide

## Issue: Missing GOOGLE_GENERATIVE_AI_API_KEY

The AI Chat feature requires a Google Gemini API key. Here's how to set it up:

## Step 1: Create .env file

Create a `.env` file in your project root (`D:/ShieldBot/.env`) with the following content:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Authapp

# Authentication
AUTH_SECRET=your-auth-secret-key-here
NODE_ENV=development

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google Generative AI (Gemini) - Required for AI Chat
GOOGLE_GENERATIVE_AI_API_KEY=your-actual-gemini-api-key-here

# Email Configuration (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# Application Configuration
PORT=5173
BASE_URL=http://localhost:5173
```

## Step 2: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Replace `your-actual-gemini-api-key-here` in your `.env` file with the actual key

## Step 3: Restart the Development Server

After adding the API key to your `.env` file:

1. Stop the current development server (Ctrl+C)
2. Restart it with: `npm run dev`

## Step 4: Test the Chat

1. Navigate to `http://localhost:5173/chatbot`
2. Send a message to test the AI integration

## Troubleshooting

### If you still get the error:

1. **Check file location**: Make sure `.env` is in the project root (`D:/ShieldBot/.env`)
2. **Check file format**: Ensure there are no spaces around the `=` sign
3. **Restart server**: Always restart the dev server after changing `.env`
4. **Check API key**: Make sure the API key is valid and active

### Example .env file structure:

```
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note**: Never commit your `.env` file to version control. It should be in your `.gitignore` file.

## Alternative: Quick Test

If you want to test the chat interface without setting up the API key, the system will now show a more helpful error message instead of crashing.
