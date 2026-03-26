# Quick Start Guide

## Prerequisites
- Node.js v16+ installed
- MongoDB running locally or connection string
- DeepSeek API key
- Anthropic (Claude) API key

## Installation Steps

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your actual values:
# - MongoDB connection string
# - JWT secret (any random string)
# - DeepSeek API key
# - Anthropic API key

# Start backend
npm run dev
```

Backend will run on http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed (default is fine for local development)

# Start frontend
npm start
```

Frontend will run on http://localhost:3000

### 3. Create Admin User

After registering your first user, you can make them an admin:

```bash
# Connect to MongoDB
mongosh

# Use the database
use ai-chatbot

# Update user to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## Testing the Application

1. **Register**: Create a new account at http://localhost:3000/register
2. **Login**: Sign in with your credentials
3. **Start Chat**: Select a model (DeepSeek or Claude) and start chatting
4. **Admin Panel**: If you made yourself admin, access http://localhost:3000/admin

## Common Issues

### MongoDB Connection Error
```
Make sure MongoDB is running:
- macOS: brew services start mongodb-community
- Linux: sudo systemctl start mongod
- Windows: net start MongoDB
```

### Port Already in Use
```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### API Key Issues
- Make sure your API keys are valid
- Check that .env file is in the correct directory
- Restart the backend after updating .env

## Next Steps

1. Customize the styling in frontend/src/App.css
2. Add more AI models in backend/src/services/aiService.js
3. Implement additional features like file uploads
4. Deploy to production (see DEPLOYMENT.md)

## Getting API Keys

### DeepSeek
1. Visit https://platform.deepseek.com/
2. Sign up for an account
3. Navigate to API Keys section
4. Generate a new key

### Claude (Anthropic)
1. Visit https://console.anthropic.com/
2. Sign up for an account
3. Navigate to API Keys section
4. Generate a new key

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the code comments
- Check the console for error messages
