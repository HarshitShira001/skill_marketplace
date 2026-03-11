const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversations);
router.get('/:requestId/messages', protect, getMessages);
router.post('/:requestId/messages', protect, sendMessage);

module.exports = router;
