# Auth App Setup Guide

This guide will help you set up the auth-app with database sessions (no JWT) for secure authentication.

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:ahmed123@localhost:5432/Authapp

# Auth.js Configuration
AUTH_SECRET=your-super-secret-auth-key-here-make-it-long-and-random-for-auth-app
```

### 3. Start Database

**Option A: Basic Setup (Database only)**

```bash
# Start PostgreSQL with Docker
npm run db:up

# Wait for database to be ready (about 10-15 seconds)
```

**Option B: Full Setup (Database + pgAdmin)**

```bash
# Start PostgreSQL + pgAdmin with Docker
npm run docker:up

# Access pgAdmin at http://localhost:8080
# Email: admin@authapp.com
# Password: admin123
```

### 4. Database Migration

```bash
# Push database schema
npm run db:push

# Seed with test user
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

## Docker Deployment Options

### Development Mode

```bash
# Basic database only
npm run db:up

# Full stack with pgAdmin
npm run docker:up
```

### Production Mode

```bash
# Full production deployment
npm run docker:full

# This includes:
# - PostgreSQL database
# - SvelteKit application
# - pgAdmin for database management
```

## Features Implemented

✅ **User Registration**: Email and password-based signup  
✅ **User Login/Logout**: Secure session management using database sessions (no JWT)  
✅ **Protected Routes**: User dashboard accessible only after authentication  
✅ **Profile Management**: Users can view and update their profile information

## Test Credentials

After running the seed script, you can test with:

- **Email**: test@example.com
- **Password**: password123

## Available Routes

- `/` - Home page with authentication status
- `/register` - User registration
- `/login` - User login
- `/dashboard` - Protected user dashboard
- `/profile` - User profile management
- `/logout` - Sign out (POST request)

## Database Sessions

This app uses **database sessions** instead of JWT tokens for enhanced security:

- Sessions are stored in the PostgreSQL database
- Session tokens are automatically managed by Auth.js
- Sessions expire after 30 days of inactivity
- Secure cookie configuration for production

## Troubleshooting

### Database Connection Issues

1. Make sure Docker is running
2. Check if PostgreSQL container is healthy: `docker ps`
3. Verify DATABASE_URL in `.env` file
4. Try restarting the database: `npm run db:restart`

### Authentication Issues

1. Clear browser cookies and try again
2. Check browser console for errors
3. Verify AUTH_SECRET is set in `.env`
4. Check server logs for authentication errors

### Development Commands

```bash
# Database operations
npm run db:up          # Start database
npm run db:down        # Stop database
npm run db:restart     # Restart database
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
npm run seed           # Seed test data

# Development
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
```

## Security Features

- ✅ Database sessions (no JWT)
- ✅ bcrypt password hashing
- ✅ Secure cookie configuration
- ✅ CSRF protection
- ✅ XSS protection headers
- ✅ Content Security Policy
- ✅ Protected routes
- ✅ Input validation
- ✅ SQL injection protection (via Drizzle ORM)

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong `AUTH_SECRET`
3. Use HTTPS
4. Configure proper database credentials
5. Set up proper domain in `AUTH_URL`

## Support

If you encounter any issues, check the console logs and ensure all dependencies are properly installed.
