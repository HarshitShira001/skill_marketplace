const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  skillRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillRequest', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
