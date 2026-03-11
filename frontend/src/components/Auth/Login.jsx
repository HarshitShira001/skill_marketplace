import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('learner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      login(data, data.token);
      navigate(data.role === 'tutor' ? '/tutor/dashboard' : '/learner/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left Column: Branding & Stats */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#4338ca] via-[#3730a3] to-[#312e81] p-12 flex flex-col items-center justify-between text-white relative overflow-hidden">
        {/* Decorative subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center h-full py-8 text-center">
          {/* Logo brought closer to welcome text */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-2xl">
              G
            </div>
            <span className="text-3xl font-['Outfit'] font-bold tracking-tight">GigSpark</span>
          </div>

          <div>
            <h1 className="text-5xl font-['Outfit'] font-bold mb-6 tracking-tight">Welcome back!</h1>
            <p className="text-indigo-100/80 text-lg leading-relaxed max-w-[280px] mx-auto font-medium">
              Continue your learning journey. Your next session is waiting.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
            <p className="text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#4f46e5] font-semibold hover:underline">
                Sign up free
              </Link>
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-100 font-medium">
                {error}
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">Sign in as</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setRole('learner')}
                  className={`p-6 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 group ${role === 'learner' ? 'border-[#4f46e5] bg-[#4f46e5]/5 shadow-md shadow-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                >
                  <div className={`font-black text-xl mb-1 transition-colors ${role === 'learner' ? 'text-[#4f46e5]' : 'text-gray-900 group-hover:text-[#4f46e5]'}`}>Learner</div>
                  <div className="text-[11px] font-medium text-gray-400 leading-tight">I want to learn new skills and grow.</div>
                </div>
                <div 
                  onClick={() => setRole('tutor')}
                  className={`p-6 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 group ${role === 'tutor' ? 'border-[#4f46e5] bg-[#4f46e5]/5 shadow-md shadow-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                >
                  <div className={`font-black text-xl mb-1 transition-colors ${role === 'tutor' ? 'text-[#4f46e5]' : 'text-gray-900 group-hover:text-[#4f46e5]'}`}>Tutor</div>
                  <div className="text-[11px] font-medium text-gray-400 leading-tight">I want to teach my skills & earn.</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] transition-all"
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button type="button" className="text-sm font-medium text-[#4f46e5] hover:underline">
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all duration-200 disabled:opacity-70 active:scale-[0.98]"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


