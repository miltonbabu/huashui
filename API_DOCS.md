# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "preferences": {
      "defaultModel": "deepseek",
      "theme": "auto"
    }
  }
}
```

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response: Same as register

### Get Current User
**GET** `/auth/me`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "preferences": {
      "defaultModel": "deepseek",
      "theme": "auto"
    },
    "usage": {
      "totalMessages": 150,
      "totalTokens": 45000
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Preferences
**PUT** `/auth/update-preferences`

Request:
```json
{
  "defaultModel": "claude",
  "theme": "dark"
}
```

---

## Conversation Endpoints

### Get All Conversations
**GET** `/conversations`

Query Parameters:
- `archived` (optional): Filter by archived status (true/false)

Response:
```json
{
  "success": true,
  "count": 5,
  "conversations": [
    {
      "_id": "conv_id",
      "title": "New Conversation",
      "model": "deepseek",
      "messageCount": 12,
      "lastMessageAt": "2024-01-15T14:30:00Z",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Conversation
**POST** `/conversations`

Request:
```json
{
  "title": "My New Chat",
  "model": "deepseek"
}
```

### Get Conversation
**GET** `/conversations/:id`

### Update Conversation
**PUT** `/conversations/:id`

Request:
```json
{
  "title": "Updated Title",
  "isArchived": false,
  "tags": ["important", "work"]
}
```

### Delete Conversation
**DELETE** `/conversations/:id`

### Get Conversation Messages
**GET** `/conversations/:id/messages`

---

## Message Endpoints

### Send Message
**POST** `/messages`

Request:
```json
{
  "conversationId": "conv_id",
  "content": "Hello, how are you?",
  "model": "claude"
}
```

Response:
```json
{
  "success": true,
  "userMessage": {
    "_id": "msg_id_1",
    "role": "user",
    "content": "Hello, how are you?",
    "createdAt": "2024-01-15T14:30:00Z"
  },
  "assistantMessage": {
    "_id": "msg_id_2",
    "role": "assistant",
    "content": "I'm doing well, thank you!",
    "model": "claude",
    "metadata": {
      "tokens": 250,
      "latency": 1234
    },
    "createdAt": "2024-01-15T14:30:02Z"
  },
  "metadata": {
    "tokens": 250,
    "latency": 1234,
    "model": "claude"
  }
}
```

### Get Messages
**GET** `/messages/:conversationId`

### Delete Message
**DELETE** `/messages/:id`

---

## Admin Endpoints

All admin endpoints require admin role.

### Get System Stats
**GET** `/admin/stats`

Response:
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 150,
      "active": 120,
      "recentRegistrations": 15
    },
    "conversations": {
      "total": 450,
      "active": 200
    },
    "messages": {
      "total": 5000,
      "totalByUsers": 4500
    },
    "tokens": {
      "total": 2500000
    },
    "models": {
      "deepseek": {
        "conversations": 250,
        "messages": 2800
      },
      "claude": {
        "conversations": 200,
        "messages": 2200
      }
    }
  }
}
```

### Get All Users
**GET** `/admin/users`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name or email
- `role`: Filter by role (admin/user)
- `isActive`: Filter by active status (true/false)

Response:
```json
{
  "success": true,
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get User
**GET** `/admin/users/:id`

### Update User
**PUT** `/admin/users/:id`

Request:
```json
{
  "name": "Updated Name",
  "role": "admin",
  "isActive": true
}
```

### Delete User
**DELETE** `/admin/users/:id`

Note: Deletes user and all their conversations/messages

### Get All Conversations (Admin)
**GET** `/admin/conversations`

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

---

## Error Responses

All endpoints may return errors in this format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

- General endpoints: 100 requests per 15 minutes per IP
- Auth endpoints (login/register): 5 requests per 15 minutes per IP

When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Model Options

Currently supported models:
- `deepseek`: DeepSeek AI model
- `claude`: Anthropic's Claude model

Each conversation is tied to a specific model, but you can override it when sending messages.

---

## Pagination

Endpoints that return lists support pagination:

Query Parameters:
- `page`: Current page (starts at 1)
- `limit`: Items per page

Response includes pagination info:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```
