import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import TutorDashboard from './pages/tutor/TutorDashboard';
import BrowseRequests from './pages/tutor/BrowseRequests';
import TutorDemoUpload from './pages/tutor/TutorDemoUpload';
import TutorChatSessions from './pages/tutor/ChatSessions';
import TutorVideoSessions from './pages/tutor/VideoSessions';
import TutorProfile from './pages/tutor/TutorProfile';
import LearnerDashboard from './pages/learner/LearnerDashboard';
import FindTutor from './pages/learner/FindTutor';
import RequestSkill from './pages/learner/RequestSkill';
import LearnerChatSessions from './pages/learner/ChatSessions';
import LearnerVideoSessions from './pages/learner/VideoSessions';
import PaymentSessions from './pages/learner/PaymentSessions';
import LearnerProfile from './pages/learner/LearnerProfile';
import RatingPage from './pages/learner/RatingPage';
import './index.css';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  
  // If no user object, redirect to signup
  if (!user) return <Navigate to="/register" replace />;
  
  // Normalize roles to lowercase for comparison to avoid 'Learner' vs 'learner' issues
  const userRole = user.role?.toLowerCase();
  const requiredRole = role?.toLowerCase();
  
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    const dashboard = user.role?.toLowerCase() === 'tutor' 
      ? '/tutor/dashboard' 
      : '/learner/dashboard';
    return <Navigate to={dashboard} replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={
        user ? (
          user.role?.toLowerCase() === 'tutor' 
            ? <Navigate to="/tutor/dashboard" replace /> 
            : <Navigate to="/learner/dashboard" replace />
        ) : <Navigate to="/register" replace />
      } />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      {/* Tutor Routes */}
      <Route path="/tutor/dashboard" element={<ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>} />
      <Route path="/tutor/browse-requests" element={<ProtectedRoute role="tutor"><BrowseRequests /></ProtectedRoute>} />
      <Route path="/tutor/demo-upload/:requestId/:skillName" element={<ProtectedRoute role="tutor"><TutorDemoUpload /></ProtectedRoute>} />
      <Route path="/tutor/chat" element={<ProtectedRoute role="tutor"><TutorChatSessions /></ProtectedRoute>} />
      <Route path="/tutor/video" element={<ProtectedRoute role="tutor"><TutorVideoSessions /></ProtectedRoute>} />
      <Route path="/tutor/profile" element={<ProtectedRoute role="tutor"><TutorProfile /></ProtectedRoute>} />
      {/* Learner Routes */}
      <Route path="/learner/dashboard" element={<ProtectedRoute role="learner"><LearnerDashboard /></ProtectedRoute>} />
      <Route path="/learner/find-tutor" element={<ProtectedRoute role="learner"><FindTutor /></ProtectedRoute>} />
      <Route path="/learner/request-skill" element={<ProtectedRoute role="learner"><RequestSkill /></ProtectedRoute>} />
      <Route path="/learner/chat" element={<ProtectedRoute role="learner"><LearnerChatSessions /></ProtectedRoute>} />
      <Route path="/learner/video" element={<ProtectedRoute role="learner"><LearnerVideoSessions /></ProtectedRoute>} />
      <Route path="/learner/payments" element={<ProtectedRoute role="learner"><PaymentSessions /></ProtectedRoute>} />
      <Route path="/learner/profile" element={<ProtectedRoute role="learner"><LearnerProfile /></ProtectedRoute>} />
      <Route path="/learner/rate/:tutorId" element={<ProtectedRoute role="learner"><RatingPage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;


