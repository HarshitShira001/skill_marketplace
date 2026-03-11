const mongoose = require('mongoose');
const ratingSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rated: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: { type: Number, min: 1, max: 5 }, comment: String,
}, { timestamps: true });
module.exports = mongoose.model('Rating', ratingSchema);
