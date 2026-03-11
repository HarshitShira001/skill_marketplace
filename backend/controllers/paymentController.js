const Razorpay = require('razorpay');
const crypto = require('crypto');
const SkillRequest = require('../models/SkillRequest');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.initiatePayment = async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  try {
    const options = { amount: amount * 100, currency, receipt };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Called after Razorpay success — marks payment as HELD (in escrow)
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, requestId } = req.body;
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest('hex');

  if (digest === razorpay_signature) {
    if (requestId) {
      await SkillRequest.findByIdAndUpdate(requestId, {
        paymentPaid: true,
        paymentStatus: 'held',  // funds held in escrow
      });
    }
    res.json({ status: 'success', message: 'Payment received and held in escrow' });
  } else {
    res.status(400).json({ status: 'failure', message: 'Invalid signature' });
  }
};

// Direct mark as held (fallback, called from frontend after Razorpay success)
exports.markPaymentDone = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sr = await SkillRequest.findById(requestId);
    if (!sr) return res.status(404).json({ message: 'Request not found' });
    if (String(sr.learner) !== String(req.user.id))
      return res.status(403).json({ message: 'Not authorized' });
    sr.paymentPaid = true;
    sr.paymentStatus = 'held';
    await sr.save();
    res.json({ paymentPaid: true, paymentStatus: 'held' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Called by tutor after session ends — requests release of escrow
exports.requestCompletion = async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`[DEBUG] Requesting completion for ID: ${requestId} by user: ${req.user.id}`);
    
    const sr = await SkillRequest.findById(requestId);
    if (!sr) {
      console.log(`[DEBUG] SkillRequest ${requestId} not found`);
      return res.status(404).json({ message: 'Request not found' });
    }
    
    console.log(`[DEBUG] Found SR. Tutor: ${sr.tutor}, Learner: ${sr.learner}, PaymentStatus: ${sr.paymentStatus}`);

    if (String(sr.tutor) !== String(req.user.id)) {
      console.log(`[DEBUG] User ${req.user.id} is not the assigned tutor ${sr.tutor}`);
      return res.status(403).json({ message: 'Only the assigned tutor can request completion' });
    }
    
    if (sr.paymentStatus !== 'held') {
      console.log(`[DEBUG] Payment status is ${sr.paymentStatus}, expected 'held'`);
      return res.status(400).json({ message: `No escrowed payment to complete (Current status: ${sr.paymentStatus})` });
    }
    
    sr.paymentStatus = 'completion_requested';
    await sr.save();
    console.log(`[DEBUG] Completion requested successfully for ${requestId}`);
    res.json({ paymentStatus: 'completion_requested', message: 'Completion requested. Waiting for learner confirmation.' });
  } catch (err) {
    console.error('[DEBUG] Error in requestCompletion:', err);
    res.status(500).json({ message: err.message });
  }
};

// Called by learner to confirm session completion — releases escrow
exports.confirmCompletion = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sr = await SkillRequest.findById(requestId);
    if (!sr) return res.status(404).json({ message: 'Request not found' });
    if (String(sr.learner) !== String(req.user.id))
      return res.status(403).json({ message: 'Only the learner can confirm completion' });
    if (sr.paymentStatus !== 'completion_requested')
      return res.status(400).json({ message: 'No completion request to confirm' });

    sr.paymentStatus = 'released';
    await sr.save();
    
    // Notify tutor dashboard to refresh stats
    const io = req.app.get('socketio');
    if (io) {
      io.emit('payment_released', { tutorId: sr.tutor, requestId: sr._id });
    }

    res.json({ paymentStatus: 'released', message: 'Payment released to tutor' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPayments = async (req, res) => {
  res.json({ message: 'getPayments' });
};

// Called by learner to decline/dispute — reverts status to held
exports.declineCompletion = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sr = await SkillRequest.findById(requestId);
    if (!sr) return res.status(404).json({ message: 'Request not found' });
    if (String(sr.learner) !== String(req.user.id))
      return res.status(403).json({ message: 'Only the learner can decline completion' });
    if (sr.paymentStatus !== 'completion_requested')
      return res.status(400).json({ message: 'No completion request to decline' });

    sr.paymentStatus = 'declined';
    await sr.save();
    res.json({ paymentStatus: 'declined', message: 'Session completion declined. Payment will be reviewed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
