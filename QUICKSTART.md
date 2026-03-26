# Quick Start Guide

## Prerequisites
- Node.js v18+ installed
- DeepSeek API key
- Anthropic (Claude) API key (optional)

## Installation Steps

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your actual values:
# - JWT secret (any random string)
# - DeepSeek API key
# - Anthropic API key (optional)

# Start backend
npm run dev
```

Backend will run on http://localhost:5000

Note: SQLite database is automatically created on first run - no additional database setup needed!

### 2. Frontend Setup

```bash
cd frontend-nextjs

# Install dependencies
npm install

# Create .env.local file (optional for local development)
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start frontend
npm run dev
```

Frontend will run on http://localhost:3000

### 3. Create Admin User

After registering your first user, you can make them an admin by directly editing the SQLite database:

```bash
# Using SQLite CLI
sqlite3 backend/database.sqlite

# Update user to admin
UPDATE Users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Or use a SQLite database browser like [DB Browser for SQLite](https://sqlitebrowser.org/).

## Testing the Application

1. **Register**: Create a new account at http://localhost:3000/register
2. **Login**: Sign in with your credentials
3. **Start Chat**: Select a model (DeepSeek or Claude) and start chatting
4. **Admin Panel**: If you made yourself admin, access http://localhost:3000/admin

## Common Issues

### Port Already in Use
```powershell
# Backend (port 5000)
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (port 3000)
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### API Key Issues
- Make sure your API keys are valid
- Check that .env file is in the correct directory
- Restart the backend after updating .env

### Database Issues
- SQLite database file is auto-created in `backend/database.sqlite`
- Delete the file to reset the database
- Check file permissions if database errors occur

## Next Steps

1. Customize the styling in `frontend-nextjs/src/app/globals.css`
2. Add more AI models in `backend/src/services/aiService.js`
3. Implement additional features like file uploads
4. Deploy to production (see below)

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

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Set up PostgreSQL database
3. Add `DATABASE_URL` to environment variables
4. Run `npm start`

### Frontend
1. Run `npm run build`
2. Run `npm run start` or deploy to Vercel

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the code comments
- Check the console for error messages
