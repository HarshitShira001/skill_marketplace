const User = require('../models/User');
const SkillRequest = require('../models/SkillRequest');
const Session = require('../models/Session');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, bio, skills, profilePhoto } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.skills = skills || user.skills;
    user.profilePhoto = profilePhoto || user.profilePhoto;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadDemoVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.demoVideo = req.file.path; // Cloudinary URL
    await user.save();

    res.json({
      message: 'Video uploaded successfully',
      url: req.file.path
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLearnerStats = async (req, res) => {
  try {
    const learnerId = req.user.id;
    
    const [totalSkillRequests, completedSessions, activeSessions] = await Promise.all([
      SkillRequest.countDocuments({ learner: learnerId }),
      Session.countDocuments({ learner: learnerId, status: 'completed' }),
      Session.countDocuments({ learner: learnerId, status: 'active' })
    ]);

    res.json({
      totalSkillRequests,
      completedSessions,
      activeSessions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMySkillRequests = async (req, res) => {
  try {
    const requests = await SkillRequest.find({ learner: req.user.id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllTutors = async (req, res) => {
  try {
    const tutors = await User.find({ role: 'tutor' }).select('-password');
    res.json(tutors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTutorStats = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const user = await User.findById(tutorId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [totalSessions, openRequestsCount] = await Promise.all([
      Session.countDocuments({ tutor: tutorId }),
      SkillRequest.countDocuments({ status: 'open' })
    ]);

    res.json({
      totalSessions,
      pendingRequests: openRequestsCount,
      totalEarnings: 0, // Placeholder as Session doesn't have price yet
      avgRating: user.rating || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSkillRequest = async (req, res) => {
  try {
    const { skillName, description, budget, preferredTime } = req.body;
    const newRequest = new SkillRequest({
      learner: req.user.id,
      skillName,
      description,
      budget,
      preferredTime,
      status: 'open'
    });
    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOpenSkillRequests = async (req, res) => {
  try {
    const requests = await SkillRequest.find({ status: 'open' })
      .populate('learner', 'name profilePhoto')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptSkillRequest = async (req, res) => {
  try {
    const request = await SkillRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'accepted';
    request.tutor = req.user.id;
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectSkillRequest = async (req, res) => {
  try {
    const request = await SkillRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'rejected';
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadRequestDemoVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const request = await SkillRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Ensure this tutor is the one who accepted the request
    if (String(request.tutor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // multer-storage-cloudinary stores the Cloudinary secure URL in req.file.path
    const videoUrl = req.file.secure_url || req.file.path;
    console.log('Cloudinary upload result:', req.file);

    request.demoVideo = videoUrl;
    await request.save();

    res.json({ message: 'Demo video uploaded successfully', url: videoUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAcceptedRequestsForLearner = async (req, res) => {
  try {
    const requests = await SkillRequest.find({
      learner: req.user.id,
      status: 'accepted'
    })
      .populate('tutor', 'name bio skills profilePhoto rating')
      .sort({ updatedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAcceptedRequestsForTutor = async (req, res) => {
  try {
    const requests = await SkillRequest.find({
      tutor: req.user.id,
      status: 'accepted'
    })
      .populate('learner', 'name profilePhoto')
      .sort({ updatedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
