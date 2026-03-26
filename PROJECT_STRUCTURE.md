# Project Structure

```
huashui-ai/
│
├── README.md                    # Main documentation
├── QUICKSTART.md               # Quick installation guide
├── API_DOCS.md                 # Complete API documentation
├── .gitignore                  # Git ignore file
│
├── backend/                    # Node.js/Express Backend
│   ├── package.json           # Backend dependencies
│   ├── .env.example           # Environment variables template
│   ├── database.sqlite        # SQLite database (auto-created)
│   │
│   └── src/
│       ├── server.js          # Main server file
│       │
│       ├── config/
│       │   └── database.js    # SQLite/PostgreSQL connection
│       │
│       ├── models/            # Sequelize Models
│       │   ├── User.js        # User schema
│       │   ├── Conversation.js # Conversation schema
│       │   └── Message.js     # Message schema
│       │
│       ├── routes/            # API Routes
│       │   ├── auth.js        # Authentication routes
│       │   ├── conversations.js # Conversation routes
│       │   ├── messages.js    # Message routes
│       │   └── admin.js       # Admin routes
│       │
│       ├── middleware/        # Custom Middleware
│       │   ├── auth.js        # Auth & authorization
│       │   └── errorHandler.js # Error handling
│       │
│       └── services/          # Business Logic
│           └── aiService.js   # AI API integration (DeepSeek/Claude)
│
└── frontend-nextjs/           # Next.js Frontend
    ├── package.json          # Frontend dependencies
    ├── next.config.ts        # Next.js configuration
    ├── tailwind.config.ts    # Tailwind CSS configuration
    │
    ├── public/               # Static assets
    │
    └── src/
        ├── app/              # App Router pages
        │   ├── layout.tsx    # Root layout
        │   ├── globals.css   # Global styles
        │   │
        │   ├── (auth)/       # Auth route group
        │   │   ├── layout.tsx
        │   │   ├── login/
        │   │   │   └── page.tsx
        │   │   └── register/
        │   │       └── page.tsx
        │   │
        │   ├── (chat)/       # Chat route group
        │   │   ├── layout.tsx
        │   │   ├── page.tsx  # Main chat page
        │   │   └── settings/
        │   │       └── page.tsx
        │   │
        │   └── admin/
        │       └── page.tsx  # Admin panel
        │
        ├── components/       # React components
        │   ├── chat/         # Chat-specific components
        │   │   ├── ChatInput.tsx
        │   │   ├── MessageBubble.tsx
        │   │   ├── MermaidDiagram.tsx
        │   │   ├── SharePopup.tsx
        │   │   └── Sidebar.tsx
        │   │
        │   ├── ui/           # Reusable UI components (shadcn)
        │   │   ├── button.tsx
        │   │   ├── input.tsx
        │   │   ├── card.tsx
        │   │   └── ...
        │   │
        │   └── providers.tsx # React Query & Theme providers
        │
        ├── hooks/            # Custom React hooks
        │   └── useSocket.ts  # Socket.io hook
        │
        ├── lib/              # Utility functions
        │   ├── api-client.ts # Axios API wrapper
        │   └── utils.ts      # Helper functions
        │
        ├── stores/           # Zustand state stores
        │   ├── authStore.ts  # Authentication state
        │   ├── chatStore.ts  # Chat state
        │   └── themeStore.ts # Theme state
        │
        └── types/            # TypeScript types
            ├── api.ts
            ├── chat.ts
            └── user.ts
```

## Key Files Explained

### Backend

**server.js**
- Express server setup
- SQLite/PostgreSQL connection
- Middleware configuration
- Route registration
- Socket.io setup
- Error handling

**config/database.js**
- SQLite for development (auto-created)
- PostgreSQL for production
- Sequelize ORM configuration

**models/**
- `User.js`: User accounts with authentication
- `Conversation.js`: Chat conversations
- `Message.js`: Individual messages

**routes/**
- `auth.js`: Login, register, user management
- `conversations.js`: CRUD for conversations
- `messages.js`: Send messages, get AI responses
- `admin.js`: Admin-only endpoints for user/system management

**services/aiService.js**
- DeepSeek API integration
- Claude API integration
- Token estimation
- Cost calculation

**middleware/**
- `auth.js`: JWT verification, role-based access
- `errorHandler.js`: Centralized error handling

### Frontend

**app/layout.tsx**
- Root layout with providers
- Theme configuration
- Font loading

**stores/**
- `authStore.ts`: Authentication state (Zustand)
- `chatStore.ts`: Chat state and conversation management
- `themeStore.ts`: Dark/light mode state

**lib/api-client.ts**
- Axios configuration
- API endpoints
- Request/response interceptors
- Token management

**Pages:**
- `login/page.tsx` & `register/page.tsx`: Authentication UI
- `(chat)/page.tsx`: Main chat interface with sidebar
- `admin/page.tsx`: Admin panel with stats and user management

## Features by File

### User Features
- **Login / Register**: Account creation and authentication
- **Chat**: 
  - Conversation management
  - Model selection (DeepSeek/Claude)
  - Real-time messaging with Socket.io
  - Message history
  - Markdown rendering
  - Code syntax highlighting
  - Mermaid diagrams
  - Math equations (KaTeX)

### Admin Features
- **Admin Panel**:
  - System statistics
  - User management (view, edit, delete, activate/deactivate)
  - Conversation monitoring
  - Model usage analytics
  - Platform health metrics

### Backend Features
- **aiService.js**: 
  - Multi-model support
  - API abstraction
  - Error handling
  - Token tracking
  - Cost estimation

- **auth.js middleware**:
  - JWT token generation
  - Token verification
  - Role-based access control
  - Password hashing

## Database Schema

### Users Table
- Authentication info (email, password hash)
- Profile (name, avatar)
- Preferences (default model, theme)
- Usage statistics (messages, tokens)
- Role (user/admin)

### Conversations Table
- User reference
- Title
- Selected model
- Message count
- Metadata (tokens, cost)
- Timestamps

### Messages Table
- Conversation reference
- User reference
- Role (user/assistant/system)
- Content
- Model used
- Metadata (tokens, latency, finish reason)
- Timestamps

## API Flow

1. User logs in → JWT token generated
2. Token stored in localStorage/Zustand
3. Token sent with all API requests
4. Backend verifies token
5. Request processed based on user role
6. Response sent back to frontend

## AI Integration Flow

1. User sends message → Frontend API call
2. Backend receives message
3. Fetch conversation history
4. Format for selected AI model
5. Call DeepSeek or Claude API
6. Receive AI response
7. Save both messages to database
8. Update conversation stats
9. Return to frontend
10. Display in chat UI

## Security Layers

1. **Password Hashing**: bcrypt with salt
2. **JWT Tokens**: 7-day expiration
3. **CORS**: Configured for frontend origin
4. **Helmet**: Security headers
5. **Rate Limiting**: IP-based throttling
6. **Input Validation**: Sequelize validation
7. **Role-Based Access**: Admin vs User permissions
