const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const Session = require('../models/Session');

exports.getSessions = async (req, res) => {
  try {
    const role = req.user.role;
    const filter = role === 'tutor' ? { tutor: req.user.id } : { learner: req.user.id };
    
    const sessions = await Session.find(filter)
      .populate('tutor', 'name profilePhoto')
      .populate('learner', 'name profilePhoto')
      .sort({ scheduledAt: 1 });
      
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.createSession = async (req, res) => { res.json({ message: 'createSession' }); };
exports.updateSession = async (req, res) => { res.json({ message: 'updateSession' }); };

exports.generateAgoraToken = async (req, res) => {
  const { channelName, uid = 0, role = 'publisher', expireTime = 3600 } = req.body;
  
  if (!channelName) {
    return res.status(400).json({ message: 'Channel name is required' });
  }

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTimestamp = currentTimestamp + expireTime;

  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpiredTimestamp
    );
    res.json({ token, channelName, uid });
  } catch (err) {
    res.status(500).json({ message: 'Token generation failed', error: err.message });
  }
};
