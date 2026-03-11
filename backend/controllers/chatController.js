const SkillRequest = require('../models/SkillRequest');
const Message = require('../models/Message');

// Get all conversations for the current user (accepted requests they are part of)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.user.role === 'tutor'
      ? { tutor: userId, status: 'accepted' }
      : { learner: userId, status: 'accepted' };

    const conversations = await SkillRequest.find(query)
      .populate('learner', 'name profilePhoto')
      .populate('tutor', 'name profilePhoto')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get messages for a specific skill request conversation
exports.getMessages = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Verify the user is part of this conversation
    const skillRequest = await SkillRequest.findById(requestId);
    if (!skillRequest) return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant =
      String(skillRequest.learner) === String(userId) ||
      String(skillRequest.tutor) === String(userId);

    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const messages = await Message.find({ skillRequest: requestId })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send a message to a skill request conversation
exports.sendMessage = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    const skillRequest = await SkillRequest.findById(requestId);
    if (!skillRequest) return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant =
      String(skillRequest.learner) === String(userId) ||
      String(skillRequest.tutor) === String(userId);

    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const message = new Message({
      skillRequest: requestId,
      sender: userId,
      content: content.trim(),
    });

    await message.save();
    await message.populate('sender', 'name profilePhoto');

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
