const express = require('express');
const router = express.Router();
const { verifyToken: auth } = require('../middleware/auth');
const { createInvite, getInviteInfo, acceptInvite } = require('../controllers/inviteController');

router.post('/', auth, createInvite);
router.get('/:token', getInviteInfo);
router.post('/:token/accept', auth, acceptInvite);

module.exports = router;
