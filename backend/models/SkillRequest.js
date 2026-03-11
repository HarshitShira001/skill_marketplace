const mongoose = require('mongoose');
const skillRequestSchema = new mongoose.Schema({
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  skillName: String, description: String, budget: Number,
  preferredTime: String,
  demoVideo: { type: String, default: null },
  transcript: { type: String, default: null },
  aiReview: { type: String, default: null },
  aiRating: { type: Number, default: null },
  paymentPaid: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['none', 'held', 'completion_requested', 'released'], default: 'none' },
  status: { type: String, enum: ['open','accepted','rejected'], default: 'open' },
}, { timestamps: true });
module.exports = mongoose.model('SkillRequest', skillRequestSchema);
