const express = require('express'); const router = express.Router();
const { getRequests, acceptRequest, rejectRequest } = require('../controllers/tutorController');
const { protect } = require('../middleware/authMiddleware');
router.get('/requests', protect, getRequests); router.put('/requests/:id/accept', protect, acceptRequest); router.put('/requests/:id/reject', protect, rejectRequest);
module.exports = router;
