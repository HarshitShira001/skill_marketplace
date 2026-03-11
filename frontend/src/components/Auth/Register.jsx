import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'learner' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      login(data, data.token);
      navigate(form.role === 'tutor' ? '/tutor/dashboard' : '/learner/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left Column: Branding & Message */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#4338ca] via-[#3730a3] to-[#312e81] p-12 flex flex-col items-center justify-between text-white relative overflow-hidden">
        {/* Decorative subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center h-full py-8 text-center">
          {/* Logo brought closer to join text */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-2xl">
              G
            </div>
            <span className="text-3xl font-['Outfit'] font-bold tracking-tight">GigSpark</span>
          </div>

          <div>
            <h1 className="text-5xl font-['Outfit'] font-bold mb-6 tracking-tight">Join GigSpark!</h1>
            <p className="text-indigo-100/80 text-lg leading-relaxed max-w-[280px] mx-auto font-medium">
              Start your learning journey. Your next session is waiting.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md my-8">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Create an account</h2>
            <p className="text-gray-500 font-medium">
              Already have one?{' '}
              <Link to="/login" className="text-[#4f46e5] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-100 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Sign up as</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setForm({...form, role: 'learner'})}
                    className={`p-6 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 group ${form.role === 'learner' ? 'border-[#4f46e5] bg-[#4f46e5]/5 shadow-md shadow-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                  >
                    <div className={`font-black text-xl mb-1 transition-colors ${form.role === 'learner' ? 'text-[#4f46e5]' : 'text-gray-900 group-hover:text-[#4f46e5]'}`}>Learner</div>
                    <div className="text-[11px] font-medium text-gray-400 leading-tight">I want to learn new skills and grow.</div>
                  </div>
                  <div 
                    onClick={() => setForm({...form, role: 'tutor'})}
                    className={`p-6 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 group ${form.role === 'tutor' ? 'border-[#4f46e5] bg-[#4f46e5]/5 shadow-md shadow-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                  >
                    <div className={`font-black text-xl mb-1 transition-colors ${form.role === 'tutor' ? 'text-[#4f46e5]' : 'text-gray-900 group-hover:text-[#4f46e5]'}`}>Tutor</div>
                    <div className="text-[11px] font-medium text-gray-400 leading-tight">I want to teach my skills & earn.</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all"
                />
                <div className="flex justify-end mt-2">
                  <button type="button" className="text-sm font-medium text-[#4f46e5] hover:underline">
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all duration-200 disabled:opacity-70 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[11px] text-gray-400">
                By creating an account you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;


