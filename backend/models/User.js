const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: { type: String, enum: ['tutor', 'learner'] },
  bio: String, skills: [String], profilePhoto: String, demoVideo: String, rating: Number,
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
