const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { register, sendOTP, verifyOTP, logout, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Multer setup for registration avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/auth/register
router.post('/register', upload.single('avatar'), register);

// POST /api/auth/send-otp
router.post('/send-otp', sendOTP);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// POST /api/auth/logout
router.post('/logout', verifyToken, logout);

// GET /api/auth/me
router.get('/me', verifyToken, getMe);

module.exports = router;
