# AI Chat Application with Semantic Search

## Overview
A modern SvelteKit application featuring AI-powered chat functionality with semantic search capabilities, user authentication, and document processing.

## Features

### 🔐 Authentication System
- User registration and login
- Email verification
- Password reset functionality
- Session management

### 💬 AI Chat System
- Real-time chat with AI
- Context-aware responses
- Message history and conversations
- Document upload and processing

### 🔍 Semantic Search
- AI-powered semantic search across conversations
- Context-aware responses using similar content
- Integration with Google's Gemini AI

### 📊 Dashboard
- User dashboard with chat history
- Admin dashboard for user management
- Analytics and user activity tracking

### 📄 Document Processing
- Support for PDF and TXT file uploads
- Text extraction and embedding generation
- RAG (Retrieval-Augmented Generation) capabilities

## Tech Stack

- **Frontend**: SvelteKit 5, TailwindCSS
- **Backend**: Node.js with SvelteKit API routes
- **Database**: PostgreSQL with pgvector extension
- **AI**: Google Gemini AI, Semantic embeddings
- **Authentication**: Auth.js (NextAuth)
- **Styling**: TailwindCSS, Radix UI components

## Project Structure
```
├── src/
│   ├── lib/
│   │   ├── components/       # UI components
│   │   ├── auth.js          # Authentication utilities
│   │   ├── db.js            # Database configuration
│   │   ├── embedding.js     # AI embedding service
│   │   └── services/        # Business logic services
│   ├── routes/              # Application routes and API endpoints
│   └── app.html             # Main HTML template
├── embedding-service/        # FastAPI Python service for AI embeddings
├── static/                   # Static assets and CSS
├── docker-compose.yml        # Database and embedding service setup
└── drizzle.config.ts         # Database schema configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Docker and Docker Compose
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd chmjunaid-and-muzamil-task-3
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment setup**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Start all services (database and embedding service)**
```bash
pnpm run start:services
```

5. **Enable pgvector extension**
```bash
pnpm run enable:pgvector
```

6. **Initialize database schema**
```bash
pnpm run db:push
```

7. **Start development server**
```bash
pnpm run dev
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm start:services` - Start all Docker services (database and embedding service)
- `pnpm db:stop` - Stop database services
- `pnpm db:push` - Push database schema changes
- `pnpm db:studio` - Open Drizzle Studio for database management

## Environment Variables

Create a `.env` file based on `env.example`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/mydatabase

# Authentication
AUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services
GEMINI_API_KEY=your-gemini-api-key
EMBEDDING_SERVICE_URL=http://localhost:8000

# Email (optional)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
```

## AI Embedding Service

The application includes a FastAPI-based embedding service that provides:

- **Text Embeddings**: Convert text to vector representations
- **Semantic Search**: Find similar content across conversations
- **Document Processing**: Extract text from PDF and TXT files
- **RAG Integration**: Context-aware AI responses

### Running the Embedding Service

```bash
cd embedding-service
pip install -r requirements.txt
python app.py
```

Or use Docker:
```bash
docker-compose up -d embedding-service
```

## Database

The application uses PostgreSQL with the pgvector extension for storing and querying embeddings:

```bash
# Enable pgvector extension (first time setup)
pnpm run enable:pgvector
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
