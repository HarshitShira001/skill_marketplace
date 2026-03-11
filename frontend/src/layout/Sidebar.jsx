import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TutorNav = [
  { path: '/tutor/dashboard', label: 'Dashboard' },
  { path: '/tutor/browse-requests', label: 'Browse Requests' },
  { path: '/tutor/chat', label: 'Chat Sessions' },
  { path: '/tutor/video', label: 'Video Sessions' },
  { path: '/tutor/profile', label: 'Profile' },
];

const LearnerNav = [
  { path: '/learner/dashboard', label: 'Dashboard' },
  { path: '/learner/find-tutor', label: 'Find Tutor' },
  { path: '/learner/request-skill', label: 'Request Skill' },
  { path: '/learner/chat', label: 'Chat Sessions' },
  { path: '/learner/video', label: 'Video Sessions' },
  { path: '/learner/payments', label: 'Payments' },
  { path: '/learner/profile', label: 'Profile' },
];

const Sidebar = ({ minimal = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'tutor' ? TutorNav : LearnerNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className="fixed left-0 top-0 h-full w-72 flex flex-col z-50"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3)',
      }}
    >
      {/* Logo */}
      <div className="px-8 pt-10 pb-8">
        <h1
          className="text-3xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          GigSpark
        </h1>
      </div>

      {!minimal && (
        <>
          {/* Navigation */}
          <nav className="flex-1 px-5 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-5 py-4 rounded-2xl text-[15px] font-extrabold tracking-wide transition-all duration-300 relative ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        background: 'rgba(79, 70, 229, 0.1)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 4px 16px rgba(79, 70, 229, 0.1), inset 0 1px 0 rgba(255,255,255,0.4)',
                        border: '1px solid rgba(79, 70, 229, 0.15)',
                      }
                    : {
                        border: '1px solid transparent',
                      }
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Info & Logout at Bottom */}
          <div className="p-5 mt-auto">
            {/* Action Buttons */}
            <div className="space-y-2 mb-6">
              <button 
                onClick={() => navigate(user?.role === 'tutor' ? '/tutor/profile' : '/learner/profile')}
                className="w-full flex items-center justify-center px-5 py-3.5 rounded-2xl bg-indigo-50/50 text-indigo-600 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-indigo-600 hover:text-white transition-all duration-300 group shadow-sm"
              >
                View Profile
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-5 py-3.5 rounded-2xl bg-rose-50/50 text-rose-600 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-rose-600 hover:text-white transition-all duration-300 group shadow-sm"
              >
                Logout
              </button>
            </div>

            {/* User Card - Clean Flat */}
            <div className="flex items-center gap-3 px-1">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-black shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-gray-800 truncate mb-1">{user?.name || 'User'}</p>
                <span
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: 'rgba(79, 70, 229, 0.1)',
                    color: '#4f46e5',
                    border: '1px solid rgba(79, 70, 229, 0.15)',
                  }}
                >
                  {user?.role || 'Learner'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {minimal && (
        <div className="p-5 mt-auto">
          {/* User Card - Clean Flat (Visible in minimal mode to maintain theme) */}
          <div className="flex items-center gap-3 px-1">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-black shrink-0"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-gray-800 truncate mb-1">{user?.name || 'User'}</p>
              <span
                className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  background: 'rgba(79, 70, 229, 0.1)',
                  color: '#4f46e5',
                  border: '1px solid rgba(79, 70, 229, 0.15)',
                }}
              >
                {user?.role || 'Learner'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default Sidebar;


