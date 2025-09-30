# AI Chat Interface Setup

This document explains how to set up the AI Chat Interface feature in ShieldBot.

## Features

- **Vercel AI SDK Integration**: Uses the latest Vercel AI SDK with Google Gemini API
- **Real-time Streaming**: Character-by-character streaming responses for better UX
- **Enhanced Message Rendering**: Supports markdown, code highlighting, and rich text
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Proper loading indicators and typing animations
- **Reusable Components**: Modular architecture with reusable chat components

## Required Dependencies

The following packages have been added to `package.json`:

```json
{
  "@ai-sdk/google": "^0.0.50",
  "ai": "^3.4.7"
}
```

## Environment Variables

Add the following environment variable to your `.env` file:

```env
# Google Generative AI (Gemini) - Required for AI Chat
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file

## Installation

1. Install the new dependencies:

   ```bash
   npm install
   ```

2. Add your Gemini API key to the `.env` file

3. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture

### Backend Components

- **`src/lib/server/ai.ts`**: AI service using Vercel AI SDK
- **`src/routes/api/chat/+server.ts`**: Standard chat API endpoint
- **`src/routes/api/chat/stream/+server.ts`**: Streaming chat API endpoint

### Frontend Components

- **`src/lib/services/chatService.ts`**: Chat service for API communication
- **`src/lib/stores/chatStore.ts`**: Svelte store for chat state management
- **`src/lib/components/EnhancedMessageRenderer.svelte`**: Enhanced message rendering with markdown support
- **`src/routes/chatbot/+page.svelte`**: Updated chatbot page with AI integration

### Key Features

1. **Streaming Responses**: Real-time character-by-character streaming
2. **Error Handling**: Comprehensive error handling with user feedback
3. **Loading States**: Visual indicators for typing and streaming states
4. **Markdown Support**: Rich text rendering with code highlighting
5. **Conversation Context**: Maintains conversation history for better responses

## Usage

1. Navigate to `/chatbot` in your application
2. Start typing a message
3. The AI will respond with streaming text
4. Messages support markdown formatting including:
   - **Bold text**
   - _Italic text_
   - `Inline code`
   - `Code blocks`
   - Headers (# ## ###)
   - Lists

## API Endpoints

### POST `/api/chat`

Standard chat endpoint that returns a complete response.

**Request:**

```json
{
  "message": "Hello, how are you?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    }
  ]
}
```

**Response:**

```json
{
  "response": "I'm doing well, thank you!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/chat/stream`

Streaming chat endpoint that returns a stream of text chunks.

**Request:** Same as above

**Response:** Server-sent events with chunks:

```
{"type": "chunk", "content": "Hello", "timestamp": "..."}
{"type": "chunk", "content": " there", "timestamp": "..."}
{"type": "complete", "timestamp": "..."}
```

## Customization

### Model Configuration

You can modify the AI model settings in `src/lib/server/ai.ts`:

```typescript
const { text } = await generateText({
  model: this.google("gemini-1.5-flash"),
  prompt,
  maxTokens: 1000, // Adjust response length
  temperature: 0.7, // Adjust creativity (0-1)
});
```

### UI Customization

The chat interface uses TailwindCSS and can be customized by modifying:

- `src/routes/chatbot/+page.svelte` - Main chat layout
- `src/routes/chatbot/components/` - Individual chat components
- `src/lib/components/EnhancedMessageRenderer.svelte` - Message styling

## Troubleshooting

### Common Issues

1. **"Missing GOOGLE_GENERATIVE_AI_API_KEY"**

   - Ensure the API key is set in your `.env` file
   - Restart the development server after adding the key

2. **"Unauthorized" errors**

   - Check that the user is properly authenticated
   - Verify the session is valid

3. **Streaming not working**
   - Check browser console for errors
   - Ensure the API key has proper permissions

### Debug Mode

Enable debug logging by adding to your `.env`:

```env
DEBUG=chat:*
```

## Security Considerations

- API keys are stored server-side only
- User authentication is required for all chat endpoints
- Input validation is performed on all messages
- Rate limiting should be implemented in production

## Performance

- Streaming responses provide immediate feedback
- Conversation history is limited to prevent memory issues
- Efficient re-rendering with Svelte's reactivity
- Optimized for real-time chat experience
