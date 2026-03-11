const express = require('express'); const router = express.Router();
const { getProfile, updateProfile, uploadDemoVideo, getLearnerStats, getMySkillRequests, getAllTutors, getTutorStats, getOpenSkillRequests, createSkillRequest, acceptSkillRequest, rejectSkillRequest, uploadRequestDemoVideo, getAcceptedRequestsForLearner, getAcceptedRequestsForTutor } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/video', protect, upload.single('video'), uploadDemoVideo);
router.get('/learner-stats', protect, getLearnerStats);
router.get('/my-requests', protect, getMySkillRequests);
router.get('/accepted-requests', protect, getAcceptedRequestsForLearner);
router.get('/tutor-accepted-requests', protect, getAcceptedRequestsForTutor);
router.get('/tutors', protect, getAllTutors);
router.get('/tutor-stats', protect, getTutorStats);
router.get('/open-requests', protect, getOpenSkillRequests);
router.post('/skill-requests', protect, createSkillRequest);
router.put('/skill-requests/:id/accept', protect, acceptSkillRequest);
router.put('/skill-requests/:id/reject', protect, rejectSkillRequest);
router.post('/skill-requests/:id/demo-video', protect, upload.single('video'), uploadRequestDemoVideo);

module.exports = router;
