# Project Structure

```
chatbot-app/
│
├── README.md                    # Main documentation
├── QUICKSTART.md               # Quick installation guide
├── API_DOCS.md                 # Complete API documentation
├── .gitignore                  # Git ignore file
│
├── backend/                    # Node.js/Express Backend
│   ├── package.json           # Backend dependencies
│   ├── .env.example           # Environment variables template
│   │
│   └── src/
│       ├── server.js          # Main server file
│       │
│       ├── models/            # MongoDB Models
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
└── frontend/                  # React Frontend
    ├── package.json          # Frontend dependencies
    ├── .env.example          # Environment variables template
    │
    ├── public/
    │   └── index.html        # HTML template
    │
    └── src/
        ├── index.js          # Entry point
        ├── index.css         # Base styles
        ├── App.js            # Main App component
        ├── App.css           # Global styles
        │
        ├── context/          # React Context
        │   └── AuthContext.js # Authentication state
        │
        ├── services/         # API Services
        │   └── api.js        # Axios API wrapper
        │
        └── pages/            # Page Components
            ├── Login.js      # Login page
            ├── Register.js   # Registration page
            ├── Chat.js       # Main chat interface
            ├── AdminDashboard.js # Admin panel
            ├── Auth.css      # Auth pages styling
            ├── Chat.css      # Chat page styling
            └── AdminDashboard.css # Admin styling
```

## Key Files Explained

### Backend

**server.js**
- Express server setup
- MongoDB connection
- Middleware configuration
- Route registration
- Error handling

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

**App.js**
- React Router setup
- Protected routes
- Public routes
- Authentication flow

**AuthContext.js**
- Global authentication state
- Login/logout functions
- User data management

**api.js**
- Axios configuration
- API endpoints
- Request/response interceptors
- Token management

**Pages:**
- `Login.js` & `Register.js`: Authentication UI
- `Chat.js`: Main chat interface with sidebar
- `AdminDashboard.js`: Admin panel with stats and user management

## Features by File

### User Features
- **Login.js / Register.js**: Account creation and authentication
- **Chat.js**: 
  - Conversation management
  - Model selection (DeepSeek/Claude)
  - Real-time messaging
  - Message history
  - Markdown rendering
  - Code syntax highlighting

### Admin Features
- **AdminDashboard.js**:
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

### Users Collection
- Authentication info (email, password hash)
- Profile (name, avatar)
- Preferences (default model, theme)
- Usage statistics (messages, tokens)
- Role (user/admin)

### Conversations Collection
- User reference
- Title
- Selected model
- Message count
- Metadata (tokens, cost)
- Timestamps

### Messages Collection
- Conversation reference
- User reference
- Role (user/assistant/system)
- Content
- Model used
- Metadata (tokens, latency, finish reason)
- Timestamps

## API Flow

1. User logs in → JWT token generated
2. Token stored in localStorage
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
6. **Input Validation**: Mongoose schemas
7. **Role-Based Access**: Admin vs User permissions
