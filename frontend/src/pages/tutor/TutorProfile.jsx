import { useState } from 'react';
import Sidebar from '../../layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const TutorProfile = () => {
  const { user, token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    experience: user?.experience || 'Expert',
    skills: (user?.skills || []).join(', '),
    rating: user?.rating || 0.0,
    reviews: user?.reviewCount || 0,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('http://localhost:5000/api/users/profile', {
        ...profile,
        skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean),
      }, {
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
            <p className="text-gray-500 text-sm mt-1">Manage your tutor profile and expertise</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">

            {/* Avatar row */}
            <div className="flex items-center gap-5 pb-6 border-b border-gray-100">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {profile.name.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <p className="font-black text-gray-900 text-base">{profile.name || 'Tutor'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-3 py-0.5 bg-violet-50 text-violet-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Expert Tutor
                  </span>
                  {profile.rating > 0 && (
                    <span className="flex items-center gap-1 px-3 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {profile.rating.toFixed(1)} Rating
                    </span>
                  )}
                </div>
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

            {/* Experience */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Experience Level <span className="text-indigo-500">*</span></label>
              <select
                value={profile.experience}
                onChange={e => setProfile({ ...profile, experience: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">Skills <span className="text-indigo-500">*</span></label>
              <input
                type="text"
                value={profile.skills}
                onChange={e => setProfile({ ...profile, skills: e.target.value })}
                placeholder="e.g. React.js, Python, UI Design..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-400 mt-1.5">Separate skills with commas</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">About Me</label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                placeholder="Describe your teaching style, background, and expertise..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition resize-none"
              />
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

export default TutorProfile;
