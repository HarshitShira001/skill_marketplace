const express = require('express');
const router = express.Router();
const { reviewDemoVideo } = require('../controllers/videoReviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:requestId/review', protect, reviewDemoVideo);

module.exports = router;
