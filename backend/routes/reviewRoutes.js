const express = require('express');
const router = express.Router();
const { createReview, getTutorReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/:tutorId', getTutorReviews);

module.exports = router;
