# AI Chat Platform - DeepSeek & Claude

A full-stack ChatGPT-like application with support for DeepSeek and Claude AI models, featuring an admin panel, user authentication, and conversation management.

## 🚀 Features

- **Multi-Model Support**: Switch between DeepSeek and Claude AI models
- **User Authentication**: JWT-based secure authentication
- **Conversation Management**: Save, organize, and search chat history
- **Admin Panel**: Manage users, view analytics, control system settings
- **Real-time Streaming**: Stream AI responses in real-time
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Rate Limiting**: Protect your API from abuse
- **User Roles**: Admin and regular user permissions

## 📁 Project Structure

```
chatbot-app/
├── frontend/           # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── context/    # React context
│   │   └── utils/      # Utility functions
│   └── package.json
├── backend/            # Node.js/Express backend
│   ├── src/
│   │   ├── models/     # MongoDB models
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Custom middleware
│   │   ├── controllers/# Route controllers
│   │   └── services/   # Business logic
│   └── package.json
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- React 18
- React Router DOM
- Axios
- Context API for state management
- CSS3 with custom animations

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- axios for API calls

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- DeepSeek API Key
- Anthropic (Claude) API Key

## 🔧 Installation

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend (.env file in /backend directory)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-chatbot
JWT_SECRET=your-super-secret-jwt-key-change-this
DEEPSEEK_API_KEY=your-deepseek-api-key
ANTHROPIC_API_KEY=your-claude-api-key
NODE_ENV=development
```

#### Frontend (.env file in /frontend directory)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Setup MongoDB

Make sure MongoDB is running on your system:

```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Linux with systemd)
sudo systemctl start mongod

# Start MongoDB (Windows)
net start MongoDB
```

### 4. Start the Application

#### Start Backend (from /backend directory)
```bash
npm run dev
```

#### Start Frontend (from /frontend directory)
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👤 Default Admin Account

After first run, you can create an admin account by registering and then updating the user role in MongoDB:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## 🔑 API Endpoints

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

## 🎨 Features Detail

### Chat Interface
- Real-time streaming responses
- Markdown support in messages
- Code syntax highlighting
- Model selection (DeepSeek/Claude)
- Conversation sidebar with search
- Message regeneration

### Admin Panel
- User management (view, edit, delete)
- System statistics dashboard
- API usage analytics
- Conversation monitoring
- System settings control

### Security
- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration

## 🚀 Deployment

### Backend Deployment (Example: Heroku/Railway)

```bash
# Make sure to set environment variables
# Deploy backend with your preferred platform
```

### Frontend Deployment (Example: Vercel/Netlify)

```bash
# Build frontend
npm run build

# Deploy the /build folder
```

### MongoDB Atlas (Cloud Database)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in backend .env

## 📝 API Keys Setup

### DeepSeek API
1. Visit https://platform.deepseek.com/
2. Sign up/Login
3. Generate API key
4. Add to backend .env as DEEPSEEK_API_KEY

### Claude API (Anthropic)
1. Visit https://console.anthropic.com/
2. Sign up/Login
3. Generate API key
4. Add to backend .env as ANTHROPIC_API_KEY

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# If not, start it with:
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Issues
- Make sure backend CORS is configured to allow your frontend URL
- Check if API_URL in frontend .env matches backend URL

## 📚 Learn More

- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Important Notes

1. **API Costs**: Both DeepSeek and Claude APIs may incur costs. Monitor your usage!
2. **Security**: Change all default secrets and passwords in production
3. **Rate Limiting**: Implement appropriate rate limits for your use case
4. **Backups**: Regularly backup your MongoDB database
5. **Environment Variables**: Never commit .env files to version control

## 🎯 Future Enhancements

- [ ] Add more AI models (GPT-4, Gemini, etc.)
- [ ] Image generation support
- [ ] File upload and analysis
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Conversation sharing
- [ ] Export conversations
- [ ] Custom model parameters
- [ ] Usage billing/tracking
- [ ] Team/Organization support

---

Built with ❤️ using DeepSeek and Claude AI
