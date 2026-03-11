import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../layout/Sidebar';
import { useAuth } from '../../context/AuthContext';

const LearnerProfile = () => {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/my-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRequests();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('http://localhost:5000/api/users/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 ml-72">
        <main className="max-w-2xl mx-auto py-14 px-6">

          {/* Page Title */}
          <div className="mb-10">
            <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your personal information and preferences</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">

            {/* Avatar row */}
            <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {profile.name.charAt(0).toUpperCase() || 'L'}
              </div>
              <div>
                <p className="font-black text-gray-900 text-base">{profile.name || 'Learner'}</p>
                <span className="inline-block mt-1 px-3 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Learner
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Full Name <span className="text-indigo-500">*</span></label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">About Me</label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                placeholder="Tell tutors about yourself, your goals, and your learning style..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition resize-none"
              />
            </div>

            {/* Stats row */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Activity</p>
              <div className="flex items-center gap-10">
                <div>
                  <p className="text-2xl font-black text-gray-900">{loading ? '–' : requests.length}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Skill Requests</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{requests.filter(r => r.status === 'accepted').length}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Accepted</p>
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-500 uppercase tracking-wider">Active</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Status</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LearnerProfile;
