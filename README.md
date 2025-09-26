# ShieldAuth - Modern Secure Authentication System with AI Assistant

A comprehensive, production-ready authentication application built with cutting-edge web technologies. ShieldAuth provides secure user authentication, role-based access control, a beautiful modern interface with advanced admin capabilities, and an integrated AI chatbot assistant for cybersecurity guidance.

## 🚀 Technology Stack

- **Frontend**: SvelteKit with Svelte 5
- **Authentication**: Auth.js with PostgreSQL Database Sessions (No JWT)
- **Styling**: TailwindCSS with custom dark theme
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Google Gemini AI with streaming responses
- **Security**: CSRF protection, bcrypt hashing, secure sessions
- **Deployment**: Docker-ready with comprehensive configuration

## ✨ Core Features

### 🤖 **ShieldBot AI Assistant**

#### **Intelligent Chat Interface**

- **Real-time AI Chat** - Interactive conversation with ShieldBot AI assistant
- **Word-by-Word Streaming** - Natural typing effect with streaming responses
- **Cybersecurity Focus** - Specialized in authentication, security, and digital safety
- **Multiple AI Models** - Support for Gemini 2.5 Pro, 2.5 Flash, 1.5 Pro, and 1.5 Flash
- **Chat Management** - Create, rename, delete, and organize chat conversations
- **Auto-Rename** - Automatic chat naming based on first message topic
- **Responsive Design** - Full-screen chat interface with collapsible sidebar

#### **AI Features**

- **Streaming Responses** - Real-time word-by-word AI response streaming
- **Model Selection** - Choose between different Gemini AI models
- **Chat History** - Persistent chat conversations with timestamps
- **Security Guidance** - Expert advice on password security, phishing protection, 2FA, and network security
- **Interactive Prompts** - Pre-built conversation starters for common security topics

#### **Advanced Message Management**

- **Message Versioning** - Complete forking system for message editing and branching
- **Edit Messages** - Edit any user message to create conversation branches
- **Regenerate Responses** - Generate new AI responses with streaming updates
- **Version Control** - Track message versions with `isActive` flags and `versionGroupId`
- **Smart Context** - AI maintains proper conversation context for versioned messages
- **First Message Protection** - Prevents forking of initial messages with user-friendly popup

### 🔐 **Authentication System**

#### **Multi-Method Authentication**

- **Email/Password Registration** - Secure account creation with email verification
- **Google OAuth Integration** - One-click sign-in with Google accounts
- **GitHub OAuth Integration** - Seamless GitHub authentication
- **Email Verification** - 6-digit verification codes with spam folder alerts
- **Password Reset** - Secure password recovery with email codes

#### **Security Features**

- **Database Sessions Only** - No JWT tokens, secure server-side sessions
- **Bcrypt Password Hashing** - Industry-standard password encryption
- **CSRF Protection** - Built-in cross-site request forgery protection
- **Input Validation** - Comprehensive server-side validation
- **Secure Headers** - Security-focused HTTP headers

### 👑 **Role-Based Access Control (RBAC)**

#### **Admin Dashboard**

- **User Analytics** - Real-time user statistics and metrics
- **System Overview** - Complete system health and activity monitoring
- **Quick Actions** - Fast access to common admin tasks
- **Modern UI** - Beautiful gradient-based interface with dark theme

#### **Advanced User Management**

- **Search & Filter** - Real-time search by name/email with role filtering
- **User Statistics** - Dynamic user counts by role (Admin/Regular users)
- **Role Management** - Promote/demote users between user and admin roles
- **Account Control** - Delete user accounts with comprehensive data removal
- **Self-Protection** - Admins cannot modify their own accounts
- **Activity Tracking** - User registration and update timestamps

### 🎨 **Modern User Interface**

#### **Dark Theme Design**

- **Consistent Dark Mode** - Beautiful black theme with blue accents throughout
- **Gradient Backgrounds** - Modern gradient overlays and textures
- **Responsive Design** - Perfect display on all devices and screen sizes
- **Professional Navigation** - Role-based navigation with smooth transitions

#### **Enhanced UX Features**

- **Slide-up Animations** - Smooth text animations on About and Contact pages
- **Interactive Elements** - Hover effects, scale transforms, and smooth transitions
- **Form Validation** - Real-time validation with user-friendly error messages
- **Loading States** - Visual feedback during form submissions and API calls
- **Accessibility** - ARIA labels, keyboard navigation, and screen reader support

### 📱 **Page-Specific Features**

#### **Homepage**

- **Hero Section** - Engaging landing page with feature showcase
- **Feature Cards** - Interactive cards highlighting system capabilities
- **ShieldBot Integration** - AI chatbot card with purple theme and functional buttons
- **Call-to-Action** - Beautiful gradient buttons for user engagement
- **Professional Footer** - Complete site navigation and social links

#### **ShieldBot Chat Interface**

- **Full-Screen Chat** - Immersive chat experience without navbar distractions
- **Collapsible Sidebar** - Chat history and management with toggle functionality
- **Model Selection** - Dropdown to choose AI model with real-time switching
- **Streaming Responses** - Word-by-word AI response streaming for natural conversation
- **Chat Prompts** - Pre-built conversation starters for security topics
- **Auto-Rename** - Intelligent chat naming based on conversation topics

#### **Enhanced Chat Management**

- **Professional Rename Modal** - Beautiful modal form for chat renaming with keyboard shortcuts
- **Smart Auto-Scroll** - Automatic scrolling to bottom on new messages and page reload
- **Empty State UI** - Beautiful interface when no conversations exist
- **Chat Deletion** - Complete cleanup of messages and conversations with confirmation
- **Page Refresh Continuity** - Resume last active chat after page reload
- **Hidden Scrollbars** - Clean UI with custom scrollbar hiding throughout the interface
- **Keyboard Navigation** - Enter/Escape key support for all modals and forms

#### **Authentication Pages**

- **Modern Login/Register** - Purple-blue gradient themes with pattern backgrounds
- **Email Verification** - 6-digit code input with individual digit fields
- **Password Management** - Secure password change and reset workflows
- **Forgot Password** - Email-based password recovery system
- **Alert Messages** - "Check Spam Section" alerts for email verification

#### **User Dashboard**

- **Profile Management** - Complete user profile with picture upload
- **Settings Panel** - User preferences and account settings
- **Activity Overview** - User activity and account information
- **Change Password** - Secure password update with modern lock icon

#### **Admin Interface**

- **Dashboard Analytics** - User statistics and system metrics
- **User Management** - Advanced search, filtering, and user control
- **Role Administration** - User role management and permissions
- **System Monitoring** - Real-time system health and activity

## 🔧 Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database Configuration (Required)
DATABASE_URL="postgresql://postgres:password@localhost:5433/authapp"

# Authentication Secret (Required)
AUTH_SECRET="your-super-secret-auth-key-here"

# AI Configuration (Required for ShieldBot)
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Environment
NODE_ENV="development"
```

**Important Notes:**

- Uses **PostgreSQL only** - no SQLite fallback
- Custom port `5433` to avoid conflicts
- Generate secure AUTH_SECRET: `openssl rand -base64 32`
- **Google AI API Key required** for ShieldBot functionality
- OAuth credentials are optional

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── Button.svelte
│   │   ├── Card.svelte
│   │   ├── Input.svelte
│   │   ├── Notification.svelte
│   │   └── EnhancedMessageRenderer.svelte
│   ├── server/              # Server-side utilities
│   │   ├── auth.ts          # Auth.js configuration
│   │   ├── ai.ts            # AI service integration
│   │   ├── db/              # Database schema and connection
│   │   ├── email.ts         # Email service
│   │   └── security.ts      # Security utilities
│   ├── services/            # Client-side services
│   │   └── clientChatService.ts  # AI chat service
│   └── stores/              # Svelte stores
├── routes/                  # Application routes
│   ├── api/                 # API endpoints
│   │   ├── auth/            # Authentication endpoints
│   │   └── chat/            # AI chat streaming endpoints
│   ├── admin/               # Admin-only pages
│   ├── auth/                # Authentication pages
│   ├── chatbot/             # ShieldBot AI chat interface
│   └── (pages)/             # Public and protected pages
└── static/                  # Static assets
```

## 🚀 Quick Start

### 1. **Clone and Install**

```bash
git clone https://github.com/muhammad-ahmed4/ShieldBot-Assignment2-Ahmed-Asghar
cd ShieldBot-Assignment2-Ahmed-Asghar
npm install
```

### 2. **Database Setup**

```bash
# Start PostgreSQL (custom port 5433)
npm run db:up

# Push database schema
npm run db:push
```

### 3. **Environment Configuration**

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5433/Authapp"

# Authentication Configuration
AUTH_SECRET="your-auth-secret-here-generate-a-long-random-string"
AUTH_TRUST_HOST=true

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Configuration (Required for ShieldBot)
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Email Configuration (Optional - for email verification and password reset)
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# Application Configuration
NODE_ENV="development"
```

**Important**: The `GOOGLE_AI_API_KEY` is required for ShieldBot functionality.

### 4. **Start Development**

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your application!

## 🤖 ShieldBot AI Features

### **Getting Started with ShieldBot**

1. **Navigate to Chatbot** - Click "Start Chat" on the homepage or visit `/chatbot`
2. **Choose AI Model** - Select from Gemini 2.5 Pro, 2.5 Flash, 1.5 Pro, or 1.5 Flash
3. **Start Conversation** - Use pre-built prompts or ask your own security questions
4. **Streaming Responses** - Watch AI responses appear word-by-word in real-time

### **AI Capabilities**

- **Password Security** - Best practices for strong passwords
- **Phishing Protection** - How to identify and avoid phishing scams
- **Two-Factor Authentication** - Benefits and setup guidance
- **Network Security** - Securing home Wi-Fi and devices
- **General Cybersecurity** - Comprehensive security advice

### **Chat Management**

- **Auto-Rename** - Chats automatically named based on first message
- **Manual Rename** - Custom chat titles for organization
- **Chat History** - Persistent conversation storage
- **Delete Chats** - Remove unwanted conversations
- **New Chat** - Start fresh conversations anytime

## 👑 Admin Features

### **Getting Admin Access**

```bash
npm run promote-admin your-email@example.com
```

### **Admin Capabilities**

- **Dashboard**: `/admin` - System analytics and overview
- **User Management**: `/admin/users` - Advanced user administration
- **Search & Filter**: Real-time user search by name/email
- **Role Management**: Promote/demote users between roles
- **Account Control**: Delete user accounts with full data removal
- **Statistics**: Dynamic user counts and activity metrics

## 🔗 OAuth Integration

### **Supported Providers**

- **Google OAuth** - Sign in with Google account
- **GitHub OAuth** - Sign in with GitHub account
- **Email/Password** - Traditional authentication

### **OAuth Features**

- **Seamless Integration** - One-click social authentication
- **Account Linking** - OAuth accounts linked to email accounts
- **Profile Sync** - Automatic name and picture sync from providers
- **Flexible Authentication** - Multiple authentication methods per user

## 📱 Application Routes

### **Public Routes**

- `/` - Homepage with feature showcase and ShieldBot card
- `/about` - About page with slide-up animations
- `/contact` - Contact page with modern UI
- `/register` - User registration with email verification
- `/login` - User login with OAuth options

### **AI Chat Routes**

- `/chatbot` - ShieldBot AI chat interface with streaming responses

### **Authentication Routes**

- `/verify-code` - Email verification with 6-digit codes
- `/forgot-password` - Password recovery request
- `/reset-password-code` - Password reset code entry
- `/reset-password` - New password creation
- `/change-password-code` - Password change verification
- `/change-password` - Password update

### **Protected Routes**

- `/dashboard` - User dashboard with profile overview
- `/profile` - Profile management with picture upload
- `/change-password` - Secure password change

### **Admin Routes**

- `/admin` - Admin dashboard with analytics
- `/admin/users` - User management with search/filter

### **API Endpoints**

- `/api/auth/*` - Authentication endpoints
- `/api/profile/*` - Profile management
- `/api/admin/users/*` - Admin user management
- `/api/chat/stream` - AI chat streaming endpoint

### **Chat Management API**

- `/api/chat/conversations` - Create and list conversations
- `/api/chat/conversations/[id]/delete` - Delete conversation with message cleanup
- `/api/chat/conversations/[id]/rename` - Rename conversation
- `/api/chat/messages/[id]/edit` - Edit message with versioning
- `/api/chat/messages/[id]/regenerate` - Regenerate AI response with streaming
- `/api/chat/messages/[id]/versions` - Get message versions

## 🛠️ Development Scripts

### **Development**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type checking and linting
```

### **Database Management**

```bash
npm run db:up        # Start PostgreSQL database
npm run db:down      # Stop PostgreSQL database
npm run db:push      # Push database schema changes
npm run db:studio    # Open Drizzle Studio
npm run seed         # Seed database with sample data
```

### **Admin Tools**

```bash
npm run promote-admin <email>  # Promote user to admin role
```

## 🎯 Key Features Breakdown

### **AI Chat Flow**

1. **Model Selection** → Choose AI model → Start conversation
2. **Streaming Response** → Word-by-word streaming → Real-time display
3. **Chat Management** → Auto-rename → Manual organization
4. **Security Guidance** → Expert advice → Interactive learning

### **Message Versioning Flow**

1. **Edit Message** → Click edit button → Modify content → Save changes
2. **Version Creation** → New message version created → Previous version deactivated
3. **AI Regeneration** → Regenerate AI response → Streaming update → Context preserved
4. **Version Navigation** → View message history → Switch between versions
5. **Context Maintenance** → AI maintains conversation context across versions

### **Authentication Flow**

1. **Registration** → Email verification → Account activation
2. **Login** → Database session creation → Protected access
3. **Password Reset** → Email code → New password creation
4. **OAuth Login** → Provider authentication → Account linking

### **Admin Workflow**

1. **User Search** → Real-time filtering → Role management
2. **Account Control** → User deletion → Complete data removal
3. **Analytics** → User statistics → System monitoring
4. **Security** → Self-protection → Audit trail

### **UI/UX Features**

1. **Dark Theme** → Consistent black theme with blue accents
2. **Animations** → Slide-up text animations and smooth transitions
3. **Responsive** → Perfect display on all devices
4. **Accessibility** → ARIA labels and keyboard navigation
5. **Streaming** → Real-time AI response streaming

### **Enhanced Chat Experience**

1. **Auto-Scroll** → Automatic scrolling to bottom on new messages
2. **Hidden Scrollbars** → Clean UI with custom scrollbar hiding
3. **Keyboard Shortcuts** → Enter/Escape key support for all modals
4. **Professional Modals** → Beautiful modal forms instead of browser prompts
5. **Empty States** → Beautiful UI when no conversations exist
6. **Page Continuity** → Resume last active chat after page reload

## 🔒 Security Implementation

### **Session Management**

- **Database Sessions** - Server-side session storage
- **30-day Expiration** - Automatic session cleanup
- **Secure Cookies** - HttpOnly, Secure, SameSite attributes
- **CSRF Protection** - Built-in cross-site request forgery protection

### **Message Versioning Security**

- **Version Control** - Secure message versioning with `versionGroupId` and `isActive` flags
- **Context Integrity** - AI maintains proper conversation context for versioned messages
- **Data Consistency** - Proper cleanup of related messages when conversations are deleted
- **First Message Protection** - Prevents forking of initial messages to maintain conversation integrity

### **Password Security**

- **Bcrypt Hashing** - Industry-standard password encryption
- **Salt Rounds** - Configurable encryption strength
- **Password Validation** - Strong password requirements
- **Secure Reset** - Email-based password recovery

### **Input Validation**

- **Server-side Validation** - All inputs validated on server
- **Type Safety** - TypeScript implementation throughout
- **SQL Injection Protection** - Drizzle ORM parameterized queries
- **XSS Protection** - Input sanitization and output encoding

### **AI Security**

- **API Key Protection** - Secure server-side AI API key handling
- **Input Sanitization** - All user inputs sanitized before AI processing
- **Rate Limiting** - Protection against AI API abuse
- **Error Handling** - Graceful AI service error management

## 🚀 Deployment

### **Production Checklist**

- ✅ Set `NODE_ENV=production`
- ✅ Configure production database URL
- ✅ Set secure `AUTH_SECRET`
- ✅ Configure `GOOGLE_AI_API_KEY` for ShieldBot
- ✅ Enable SSL for database connections
- ✅ Configure reverse proxy
- ✅ Set up monitoring and logging

### **Docker Deployment**

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.full.yml up -d
```

## 📊 Performance Optimizations

### **Frontend**

- **Code Splitting** - Automatic bundle optimization
- **Component Library** - Reusable, optimized components
- **TailwindCSS Purging** - Optimized CSS for production
- **Image Optimization** - Compressed and optimized assets
- **Streaming Optimization** - Efficient AI response streaming

### **Backend**

- **Connection Pooling** - Efficient database connections
- **Query Optimization** - Optimized database queries
- **Caching** - Strategic caching implementation
- **Error Handling** - Graceful error management
- **AI Response Caching** - Optimized AI service calls

### **Message Versioning System**

- **Tree Structure** - Messages organized in tree structure with `parentId` relationships
- **Version Groups** - Messages grouped by `versionGroupId` for easy version tracking
- **Active Flags** - `isActive` flag to identify current version of each message
- **Version Numbers** - Sequential `versionNumber` for version ordering
- **Context Preservation** - AI maintains conversation context across message versions
- **Data Integrity** - Proper cleanup of related messages when conversations are deleted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [SvelteKit](https://kit.svelte.dev/) - The web framework
- [Auth.js](https://authjs.dev/) - Authentication for the web
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [PostgreSQL](https://www.postgresql.org/) - Advanced open source database
- [Google Gemini AI](https://ai.google.dev/) - Advanced AI capabilities

---

**ShieldAuth** - Built with ❤️ using modern web technologies for secure, scalable authentication with intelligent AI assistance.

## 🔮 Recent Updates

### **v3.0 - Complete Forking Implementation** 🎉

#### **🤖 Enhanced AI Chat Experience**
- ✅ **Message Versioning** - Complete message forking and versioning system
- ✅ **Edit & Regenerate** - Edit any message or regenerate AI responses
- ✅ **Smart Context Handling** - AI maintains proper conversation context for versioned messages
- ✅ **Streaming Regeneration** - Real-time streaming for regenerated responses
- ✅ **First Message Protection** - Prevents forking of first messages with user-friendly popup

#### **💬 Advanced Chat Management**
- ✅ **Professional Rename Modal** - Beautiful modal form instead of browser prompts
- ✅ **Smart Auto-Rename** - Automatic chat naming based on conversation topics
- ✅ **Chat Deletion** - Complete cleanup of messages and conversations
- ✅ **Empty State Handling** - Beautiful UI when no conversations exist
- ✅ **Page Refresh Continuity** - Resume last active chat after page reload

#### **🎨 Enhanced User Interface**
- ✅ **Auto-Scroll Functionality** - Smooth scrolling to bottom on new messages
- ✅ **Hidden Scrollbars** - Clean UI with custom scrollbar hiding
- ✅ **Keyboard Shortcuts** - Enter/Escape key support for all modals
- ✅ **Responsive Design** - Perfect display on all devices
- ✅ **Dark Theme Consistency** - Unified dark theme throughout

#### **🔧 Technical Improvements**
- ✅ **Error Handling** - Comprehensive error handling and user feedback
- ✅ **State Management** - Enhanced chat store with proper state management
- ✅ **API Optimization** - Improved API endpoints for better performance
- ✅ **Database Integrity** - Proper message cleanup and data consistency
- ✅ **Real-time Updates** - Immediate UI updates for all chat operations

### **v2.0 - ShieldBot AI Integration**

- ✅ **AI Chat Interface** - Full-screen chat with ShieldBot AI assistant
- ✅ **Streaming Responses** - Word-by-word AI response streaming
- ✅ **Model Selection** - Support for multiple Gemini AI models
- ✅ **Chat Management** - Auto-rename, manual rename, and chat organization
- ✅ **Security Focus** - Specialized cybersecurity guidance and advice
- ✅ **Responsive Design** - Mobile-optimized chat interface
- ✅ **UI Improvements** - Fixed ShieldBot card styling and dashboard icons
- ✅ **Performance** - Optimized streaming and error handling
