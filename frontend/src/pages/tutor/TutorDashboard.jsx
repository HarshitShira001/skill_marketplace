import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../layout/Sidebar';
import Navbar from '../../layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const TutorDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    pendingRequests: 0,
    totalEarnings: 0,
    avgRating: 0
  });
  const [sessions, setSessions] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]); // Added to track accepted requests
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [profileRes, statsRes, sessionsRes, acceptedRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/profile', { headers }),
          axios.get('http://localhost:5000/api/users/tutor-stats', { headers }),
          axios.get('http://localhost:5000/api/sessions', { headers }),
          axios.get('http://localhost:5000/api/users/tutor-accepted-requests', { headers })
        ]);
        
        setVideoUrl(profileRes.data.demoVideo);
        setStats(statsRes.data);
        setSessions(sessionsRes.data);
        setAcceptedRequests(acceptedRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
      
      // Auto-refresh when payment is released
      if (!socketRef.current) {
        socketRef.current = io('http://localhost:5000', { transports: ['websocket'] });
        socketRef.current.on('payment_released', (data) => {
          if (data.tutorId === user?._id || data.tutorId === user?.id) {
            fetchData();
          }
        });
      }

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    setUploading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/users/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setVideoUrl(res.data.url);
      alert('Video uploaded successfully!');
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const statCards = [
    { label: 'Total Sessions', value: stats.totalSessions, color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
    { label: 'Pending Requests', value: stats.pendingRequests, color: 'bg-amber-50 border-amber-100 text-amber-600' },
    { label: 'Total Earnings', value: `₹${stats.totalEarnings}`, color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    { label: 'Avg. Rating', value: stats.avgRating > 0 ? `${stats.avgRating}` : 'N/A', color: 'bg-rose-50 border-rose-100 text-rose-600' },
  ];

  return (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <div className="flex-1 ml-72">
      <main className="p-6">
        {/* Welcome */}
        <div className="mb-8 p-10 bg-gradient-to-br from-[#4338ca] via-[#3730a3] to-[#312e81] rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-white/5 rounded-full -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black mb-2 tracking-tight">Welcome back, {user?.name || 'Tutor'}!</h2>
              {stats.avgRating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-widest border border-white/20">
                    <svg className="w-3.5 h-3.5 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {stats.avgRating.toFixed(1)} Learner Rating
                  </span>
                </div>
              )}
            </div>
            <label className="cursor-pointer bg-white text-indigo-600 hover:scale-105 px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-indigo-900/20 active:scale-95 text-center">
              {uploading ? 'Uploading...' : 'Update Demo Video'}
              <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
            </label>
          </div>
        </div>

        {videoUrl && (
          <div className="mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              YOUR DEMO VIDEO
            </h3>
            <video src={videoUrl} controls className="w-full max-h-[300px] rounded-xl bg-black" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-3xl p-6 border transition-all duration-300 ${s.color} hover:shadow-lg hover:-translate-y-1 group`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-3xl font-black tracking-tighter">{s.value}</p>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Accepted Skill Requests */}
        <div className="space-y-6 mt-10">
          <h3 className="text-xl font-black text-gray-900">Pending Skill Requests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedRequests.length > 0 ? (
              acceptedRequests.map((req, i) => (
                <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:border-indigo-100 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner overflow-hidden">
                        {req.learner?.profilePhoto ? (
                          <img src={req.learner.profilePhoto} className="w-full h-full object-cover" alt="" />
                        ) : (
                          req.learner?.name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-base">{req.learner?.name}</p>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-tight">{req.skillName}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                      req.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Description</p>
                    <p className="text-gray-600 text-sm line-clamp-2">{req.description}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link 
                      to={`/tutor/demo-upload/${req._id}/${encodeURIComponent(req.skillName)}`}
                      className="flex-1 py-3 bg-indigo-600 text-white text-center rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                      {req.demoVideo ? 'Update Demo' : 'Upload Demo'}
                    </Link>
                    <Link 
                      to="/tutor/chat"
                      className="px-4 py-3 bg-gray-50 text-gray-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))
            ) : !loading && (
              <div className="md:col-span-2 lg:col-span-3 py-12 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold italic">No pending skill requests.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-gray-900">Upcoming Sessions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length > 0 ? (
              sessions.map((s, i) => (
                <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:border-indigo-100 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">
                        {s.learner?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-base">{s.learner?.name}</p>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-tight">{s.skill}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Date & Time</p>
                    <p className="text-gray-700 font-bold text-sm">{new Date(s.scheduledAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                      Start Session
                    </button>
                  </div>
                </div>
              ))
            ) : !loading && (
              <div className="md:col-span-2 lg:col-span-3 py-12 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold italic">No upcoming sessions found.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  </div>
);
};

export default TutorDashboard;


