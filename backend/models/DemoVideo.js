const mongoose = require('mongoose');
const demoVideoSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  url: String, skill: String, duration: Number,
}, { timestamps: true });
module.exports = mongoose.model('DemoVideo', demoVideoSchema);
