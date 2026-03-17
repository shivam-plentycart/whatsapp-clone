require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init');
const { initializeSocket } = require('./socket/socketHandler');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Database
initializeDatabase();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const uploadRoutes = require('./routes/upload');
const inviteRoutes = require('./routes/invites');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/invites', inviteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'WhatsApp Clone API is running', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO handlers
initializeSocket(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Serve built React client — must be last
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Clone Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌍 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Run this command to free it: npx kill-port ${PORT}`);
    console.error(`   Or set a different PORT in your .env file.`);
    process.exit(1);
  } else {
    throw err;
  }
});

module.exports = { app, io };
