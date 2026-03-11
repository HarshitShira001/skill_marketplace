import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../layout/Sidebar';
import Navbar from '../../layout/Navbar';
import { useAuth } from '../../context/AuthContext';

const FindTutor = () => {
  const { token } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTutor, setSelectedTutor] = useState(null);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/accepted-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Transform accepted requests into a displayable format
        const matchedTutors = res.data.map(req => ({
          ...req.tutor,
          matchedSkill: req.skillName,
          requestId: req._id
        }));
        setTutors(matchedTutors);
      } catch (err) {
        console.error('Error fetching tutors:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTutors();
  }, [token]);

  const filteredTutors = tutors.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.matchedSkill?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 ml-72">
        <main className="p-6">
          {/* Search Header */}
          <div className="mb-8 p-12 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] rounded-2xl text-white relative overflow-hidden shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative z-10 max-w-2xl text-center md:text-left mx-auto md:mx-0">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-[1.1]">Find Your Perfect <br/>Skill Mentor</h2>
              <div className="relative mt-8 max-w-md mx-auto md:mx-0">
                <input
                  type="text"
                  placeholder="Search by name or skill..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4.5 px-6 text-white placeholder-indigo-200 focus:outline-none focus:ring-4 focus:ring-white/10 backdrop-blur-xl transition-all font-bold shadow-2xl"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white h-48 rounded-[2rem] border border-gray-100 animate-pulse shadow-sm" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  Tutors Matched For You
                  <span className="bg-emerald-50 text-emerald-600 text-sm px-3 py-1 rounded-full">{filteredTutors.length}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutors.length > 0 ? (
                  filteredTutors.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedTutor(t)}
                      className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-2xl hover:border-indigo-100 transition-all text-left group relative overflow-hidden flex flex-col items-center gap-4"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                         <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </div>
                      <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-3xl shadow-inner border-4 border-white group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                        {t.profilePhoto ? <img src={t.profilePhoto} alt={t.name} className="w-full h-full object-cover" /> : (t.name?.[0] || 'T')}
                      </div>
                      <div className="text-center w-full">
                        <p className="font-black text-gray-900 text-lg mb-1">{t.name}</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-tight bg-emerald-50 text-emerald-500 px-3 py-1 rounded-lg">
                            Matched for {t.matchedSkill}
                          </span>
                          {t.rating > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tight bg-amber-50 text-amber-600 px-3 py-1 rounded-lg border border-amber-100/50">
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              {t.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <p className="text-gray-400 font-black text-lg italic">No tutors found matching your search.</p>
                    <button onClick={() => setSearch('')} className="mt-4 text-indigo-600 font-bold hover:underline">Clear Search</button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Profile Modal */}
          {selectedTutor && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setSelectedTutor(null)}>
              <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-8 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Tutor Profile</h4>
                      <p className="text-xl font-black text-gray-900 leading-none mt-1">Available Expert</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTutor(null)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all font-black">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                  <div className="flex items-center gap-6 mb-8 p-6 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
                    <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white font-black text-4xl shadow-xl overflow-hidden border-4 border-white">
                      {selectedTutor.profilePhoto ? <img src={selectedTutor.profilePhoto} alt={selectedTutor.name} className="w-full h-full object-cover" /> : (selectedTutor.name?.[0] || 'T')}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-2xl font-black text-gray-900 mb-2">{selectedTutor.name}</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedTutor.rating && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-100/50">
                             <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                             {selectedTutor.rating} Rating
                          </span>
                        )}
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100/50">
                          Active Now
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedTutor.bio && (
                    <div className="mb-8 px-2">
                      <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-2">About Tutor</h6>
                      <p className="text-sm text-gray-600 leading-relaxed">{selectedTutor.bio}</p>
                    </div>
                  )}
                  {selectedTutor.skills?.length > 0 && (
                    <div className="mb-8 px-2">
                       <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-2">Expertise</h6>
                       <div className="flex flex-wrap gap-2">
                          {selectedTutor.skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] font-extrabold text-indigo-500 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-xl uppercase tracking-wider">{s}</span>
                          ))}
                        </div>
                    </div>
                  )}
                  <div className="px-2">
                    <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-2">Pricing</h6>
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-6 flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Rate</p>
                         <p className="text-2xl font-black text-gray-900">₹{selectedTutor.hourlyRate || 500}<span className="text-sm text-gray-400 ml-1">/session</span></p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/30">
                  <button className="flex-1 py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-[1.8rem] flex items-center justify-center gap-2 shadow-2xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95">
                    Start Learning
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FindTutor;


