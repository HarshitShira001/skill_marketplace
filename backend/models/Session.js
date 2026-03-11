const mongoose = require('mongoose');
const sessionSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skill: String, scheduledAt: Date, duration: Number,
  status: { type: String, enum: ['pending','active','completed','cancelled'], default: 'pending' },
}, { timestamps: true });
module.exports = mongoose.model('Session', sessionSchema);
