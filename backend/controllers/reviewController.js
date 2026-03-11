const Review = require('../models/Review');
const User = require('../models/User');

exports.createReview = async (req, res) => {
  const { tutorId, rating, comment } = req.body;
  const learnerId = req.user.id;

  try {
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const review = await Review.create({
      tutor: tutorId,
      learner: learnerId,
      rating,
      comment
    });

    // Update tutor's average rating
    const reviews = await Review.find({ tutor: tutorId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    
    tutor.rating = avgRating;
    await tutor.save();

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTutorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tutor: req.params.tutorId })
      .populate('learner', 'name profilePhoto')
      .sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
