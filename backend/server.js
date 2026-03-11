const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/tutors', require('./routes/tutorRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/video-review', require('./routes/videoReviewRoutes'));

// Create HTTP + Socket.IO server
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
app.set('socketio', io);

io.on('connection', (socket) => {
  // Join a conversation room for a skill request
  socket.on('join_room', (requestId) => {
    socket.join(requestId);
  });

  // When a user sends a message, broadcast to all in the room
  socket.on('send_message', (data) => {
    // data: { requestId, message (populated message object) }
    io.to(data.requestId).emit('receive_message', data.message);
  });

  // Handle escrow status changes (held -> completion_requested -> released/declined)
  socket.on('payment_status_change', (data) => {
    io.to(data.requestId).emit('status_updated', data);
  });

  // Tutor requests session completion — notifies learner in same room
  socket.on('request_session_completion', (data) => {
    // data: { requestId, tutorName }
    io.to(data.requestId).emit('session_completion_requested', data);
  });

  // Learner accepts session completion
  socket.on('accept_session_completion', (data) => {
    // data: { requestId }
    io.to(data.requestId).emit('session_completion_accepted', data);
  });

  // Learner declines session completion
  socket.on('decline_session_completion', (data) => {
    // data: { requestId }
    io.to(data.requestId).emit('session_completion_declined', data);
  });

  socket.on('disconnect', () => {});
});

// Export io so controllers can use it if needed
module.exports = { io };

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
