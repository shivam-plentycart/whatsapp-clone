# WhatsApp Web Clone

A complete, fully functional WhatsApp Web clone built with React.js 18, Node.js, Socket.IO, and SQLite3.

## Features

- ✅ Phone number registration + OTP verification (demo OTP logged to console)
- ✅ JWT authentication with auto-login
- ✅ Real-time messaging with Socket.IO
- ✅ Message status ticks: sent (✓), delivered (✓✓), read (✓✓ blue)
- ✅ Typing indicators
- ✅ Online/offline status in real-time
- ✅ Reply to messages
- ✅ Delete message (for me / for everyone)
- ✅ Emoji picker
- ✅ Profile picture upload
- ✅ Edit name & about
- ✅ Search users to start new chat
- ✅ Unread message count badges
- ✅ Pagination (load older messages)
- ✅ Pixel-perfect WhatsApp Web UI with CSS Modules
- ✅ Chat wallpaper background pattern
- ✅ Green sent bubbles, white received bubbles
- ✅ Context menu (right-click on messages)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Pure CSS Modules |
| State | React Context API + useReducer |
| Real-time | Socket.IO |
| Backend | Node.js + Express |
| Database | SQLite3 (better-sqlite3) |
| Auth | JWT + OTP |
| Uploads | Multer |

## Project Structure

```
whatsapp-clone/
├── server/          # Express + Socket.IO backend
└── client/          # React + Vite frontend
```

## Quick Start

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Install Client Dependencies

```bash
cd client
npm install
```

### 3. Start the Server

```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

### 4. Start the Client (in a new terminal)

```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 5. Open the App

Navigate to `http://localhost:5173`

## Testing with 2 Users

1. Open `http://localhost:5173` in **Tab 1**
2. Register User 1 (e.g., phone: `+911234567890`, name: `Alice`)
3. Check server console for OTP → verify
4. Open `http://localhost:5173` in a **private/incognito Tab 2**
5. Register User 2 (e.g., phone: `+911234567891`, name: `Bob`)
6. In Tab 1 (Alice), click the chat icon → search for "Bob" → start chat
7. Send messages between tabs — status updates happen in real-time!

## Demo OTP

Since this is a demo app (no SMS gateway), OTPs are:
- Printed in the **server console**
- Shown in an **alert popup** in the browser
- Also returned in the API response as `demo_otp`

> **Note:** Remove `demo_otp` from API responses in production!

## Environment Variables

Server `.env` (already created):
```
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP & get token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?query=...` | Search users |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/avatar` | Update avatar |

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats/conversations` | Get all conversations |
| GET | `/api/chats/:id/messages` | Get messages |
| POST | `/api/chats/conversation` | Create/get conversation |
| DELETE | `/api/chats/messages/:id/me` | Delete for me |
| DELETE | `/api/chats/messages/:id/everyone` | Delete for everyone |

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `send_message` | `{conversationId, receiverId, content, replyToId}` | Send a message |
| `mark_read` | `{conversationId, senderId}` | Mark messages as read |
| `typing_start` | `{conversationId, receiverId}` | Start typing |
| `typing_stop` | `{conversationId, receiverId}` | Stop typing |
| `delete_message` | `{messageId, conversationId, deleteForEveryone}` | Delete message |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{message, conversationId}` | New message received |
| `message_sent` | `{message, conversationId}` | Message sent confirmation |
| `message_status_update` | `{messageId, conversationId, status}` | Status update |
| `messages_read` | `{conversationId, readBy}` | Messages marked read |
| `user_typing` | `{conversationId, userId, isTyping}` | Typing status |
| `user_status_change` | `{userId, isOnline, lastSeen}` | Online status change |
| `message_deleted` | `{messageId, conversationId, forEveryone}` | Message deleted |

## WhatsApp Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-primary` | `#00a884` | Buttons, active states |
| `--color-primary-dark` | `#008069` | Header, dark green |
| `--color-bubble-sent` | `#d9fdd3` | Sent messages |
| `--color-bubble-received` | `#ffffff` | Received messages |
| `--color-bg-chat` | `#e5ddd5` | Chat wallpaper |
| `--color-tick-blue` | `#53bdeb` | Read receipts |
| `--color-unread` | `#25d366` | Unread badge |
