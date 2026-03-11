import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../layout/Sidebar';
import Navbar from '../../layout/Navbar';
import { useAuth } from '../../context/AuthContext';

const RequestSkill = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [form, setForm] = useState({ skillName: '', description: '', budget: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post('http://localhost:5000/api/users/skill-requests', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Navigate to dashboard immediately after success
      navigate('/learner/dashboard');
    } catch (err) {
      console.error('Error submitting skill request:', err);
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-72 flex flex-col items-center justify-center p-6">
        <main className="w-full max-w-2xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800">Post a Skill Request</h3>
            <p className="text-sm text-gray-500 mt-1">Tell tutors what you want to learn and they'll reach out to you</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <p className="text-sm font-bold text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Skill Name *</label>
                <input
                  type="text"
                  name="skillName"
                  value={form.skillName}
                  onChange={handleChange}
                  placeholder="e.g. React.js, Python, UI Design..."
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what you want to learn, your current level, and specific topics..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all text-gray-700 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget (per hour) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    placeholder="500"
                    required
                    className="w-full pl-7 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all text-gray-700"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:scale-[1.01] active:scale-[0.99] uppercase text-xs tracking-widest ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Submitting Request...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RequestSkill;


