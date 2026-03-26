# Huashui AI - AI Chat Platform

A modern full-stack AI chat application with support for DeepSeek and Claude AI models, featuring real-time streaming, user authentication, and conversation management.

## Features

- **Multi-Model Support**: Switch between DeepSeek and Claude AI models
- **Real-time Streaming**: Stream AI responses with Socket.io
- **User Authentication**: JWT-based secure authentication
- **Conversation Management**: Save, organize, and search chat history
- **Admin Panel**: Manage users, view analytics, control system settings
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS
- **Markdown Support**: Rich text rendering with code highlighting, math equations (KaTeX), and diagrams (Mermaid)
- **Rate Limiting**: Protect your API from abuse
- **User Roles**: Admin and regular user permissions

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Zustand** - State management
- **React Query** - Data fetching
- **shadcn/ui** - UI components
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (with Sequelize ORM)
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Project Structure

```
huashui-ai/
├── frontend-nextjs/          # Next.js frontend application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── (auth)/       # Auth pages (login, register)
│   │   │   ├── (chat)/       # Chat pages
│   │   │   └── admin/        # Admin panel
│   │   ├── components/       # React components
│   │   │   ├── chat/         # Chat-specific components
│   │   │   └── ui/           # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # TypeScript types
│   └── package.json
├── backend/                  # Node.js/Express backend
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── middleware/       # Custom middleware
│   │   ├── models/           # Sequelize models
│   │   ├── routes/           # API routes
│   │   └── services/         # Business logic
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- DeepSeek API Key
- Anthropic (Claude) API Key

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/miltonbabu/huashui-ai.git
cd huashui-ai
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend-nextjs
npm install
```

### 3. Environment Configuration

#### Backend (.env file in /backend directory)

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this
DEEPSEEK_API_KEY=your-deepseek-api-key
ANTHROPIC_API_KEY=your-claude-api-key
NODE_ENV=development
```

#### Frontend (.env.local file in /frontend-nextjs directory)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start the Application

#### Start Backend (from /backend directory)

```bash
npm run dev
```

#### Start Frontend (from /frontend-nextjs directory)

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Conversations
- `GET /api/conversations` - Get all user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get specific conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Messages
- `POST /api/messages` - Send message and get AI response
- `GET /api/messages/:conversationId` - Get conversation messages

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/stats` - Get system statistics (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

## Default Admin Account

After first run, you can create an admin account by registering and then updating the user role in the database:

```javascript
// Using SQLite CLI or a database browser
// Update the user's role to 'admin' in the Users table
```

## API Keys Setup

### DeepSeek API
1. Visit https://platform.deepseek.com/
2. Sign up/Login
3. Generate API key
4. Add to backend .env as `DEEPSEEK_API_KEY`

### Claude API (Anthropic)
1. Visit https://console.anthropic.com/
2. Sign up/Login
3. Generate API key
4. Add to backend .env as `ANTHROPIC_API_KEY`

## Deployment

### Backend Deployment

```bash
# Build and start in production mode
cd backend
npm start
```

### Frontend Deployment

```bash
# Build for production
cd frontend-nextjs
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

Make sure to set all environment variables in your production environment:
- `JWT_SECRET` - Use a strong, unique secret
- `DEEPSEEK_API_KEY` - Your DeepSeek API key
- `ANTHROPIC_API_KEY` - Your Claude API key
- `NEXT_PUBLIC_API_URL` - Your backend API URL

## Security Notes

1. **API Costs**: Both DeepSeek and Claude APIs may incur costs. Monitor your usage!
2. **Security**: Change all default secrets and passwords in production
3. **Rate Limiting**: Implement appropriate rate limits for your use case
4. **Environment Variables**: Never commit .env files to version control

## License

This project is licensed under the MIT License.

---

Built with Next.js, Express, and AI power from DeepSeek & Claude
