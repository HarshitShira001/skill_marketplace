const express = require('express'); const router = express.Router();
const { getSessions, createSession, updateSession, generateAgoraToken } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');
router.get('/', protect, getSessions); 
router.post('/', protect, createSession); 
router.put('/:id', protect, updateSession);
router.post('/agora-token', protect, generateAgoraToken);
module.exports = router;
