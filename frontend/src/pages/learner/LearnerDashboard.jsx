import Sidebar from '../../layout/Sidebar';
import Navbar from '../../layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import VideoReviewResult from '../../components/VideoReviewResult';



const LearnerDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSkillRequests: 0,
    completedSessions: 0,
    activeSessions: 0
  });
  const [skillRequests, setSkillRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, requestsRes, acceptedRes, tutorsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/learner-stats', { headers }),
          axios.get('http://localhost:5000/api/users/my-requests', { headers }),
          axios.get('http://localhost:5000/api/users/accepted-requests', { headers }),
          axios.get('http://localhost:5000/api/users/tutors', { headers })
        ]);
        
        setStats(statsRes.data);
        setSkillRequests(requestsRes.data);
        setAcceptedRequests(acceptedRes.data);
        setTutors(tutorsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString();
  };

  const triggerAIReview = async (requestId) => {
    setReviewing(true);
    setReviewError('');
    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/video-review/${requestId}/review`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state with the new AI review data so it shows immediately
      setSelectedRequest(prev => ({
        ...prev,
        aiRating: data.result.aiRating,
        aiReview: data.result.aiReview,
        transcript: data.result.transcript
      }));
      
      // Update in the main list too
      setAcceptedRequests(prev => 
        prev.map(r => r._id === requestId ? { ...r, ...data.result } : r)
      );

    } catch (err) {
      console.error('AI Review Error:', err);
      setReviewError('Failed to analyze the video. Please try again.');
    } finally {
      setReviewing(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-72">
        <main className="p-6">
          <div className="mb-8 p-10 bg-gradient-to-br from-[#4338ca] via-[#3730a3] to-[#312e81] rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-black mb-2 tracking-tight">Hello, {user?.name || 'Learner'}!</h2>
              <button className="mt-8 bg-white text-indigo-600 px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-indigo-900/20 active:scale-95">
                Book Another Session →
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
              <div className="rounded-3xl p-6 border transition-all duration-300 bg-indigo-50 border-indigo-100 text-indigo-600 hover:shadow-lg hover:-translate-y-1">
                <p className="text-3xl font-black tracking-tighter">{stats.totalSkillRequests}</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Total Requests</p>
              </div>
              <div className="rounded-3xl p-6 border transition-all duration-300 bg-emerald-50 border-emerald-100 text-emerald-600 hover:shadow-lg hover:-translate-y-1">
                <p className="text-3xl font-black tracking-tighter">{stats.completedSessions}</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Completed Sessions</p>
              </div>
              <div className="rounded-3xl p-6 border transition-all duration-300 bg-amber-50 border-amber-100 text-amber-600 hover:shadow-lg hover:-translate-y-1">
                <p className="text-3xl font-black tracking-tighter">{stats.activeSessions}</p>
                <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Active Sessions</p>
              </div>
            </div>
            
            <Link 
              to="/learner/request-skill"
              className="bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 whitespace-nowrap self-start md:self-center"
            >
              <span className="text-xl">+</span> Add New Request
            </Link>
          </div>

        <div className="space-y-12">
          {/* Section 1: Skill Requests (Full Width Grid) */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              My Skill Requests
              <span className="text-sm font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{skillRequests.length}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skillRequests.length > 0 ? (
                skillRequests.map((r, i) => (
                  <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-lg leading-tight">{r.skillName}</p>
                        <p className="text-xs font-bold text-indigo-600 mt-1">Budget: ₹{r.budget}</p>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase flex-shrink-0 ${r.status === 'open' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{formatDate(r.createdAt)}</p>
                      <button className="text-indigo-600 font-bold text-xs hover:underline">View Details</button>
                    </div>
                  </div>
                ))
              ) : !loading && (
                <div className="md:col-span-2 lg:col-span-3 py-12 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold italic">No requests posted yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Tutors Matched For You - Small Cards */}
          {acceptedRequests.length > 0 && (
            <div className="space-y-5">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                Tutors Matched For You
                <span className="text-sm font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">{acceptedRequests.length}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedRequests.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedRequest(r)}
                    className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-4 hover:shadow-xl hover:border-indigo-200 transition-all text-left group relative overflow-hidden flex flex-col items-center gap-3"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-inner overflow-hidden border-2 border-white group-hover:scale-110 transition-transform duration-500">
                      {r.tutor?.profilePhoto
                        ? <img src={r.tutor.profilePhoto} alt={r.tutor?.name} className="w-full h-full object-cover" />
                        : (r.tutor?.name?.[0] || 'T')}
                    </div>
                    <div className="text-center w-full">
                      <p className="font-black text-gray-900 text-sm truncate mb-0.5">{r.tutor?.name}</p>
                      <span className="inline-block text-[9px] font-black uppercase tracking-tight bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-lg">{r.skillName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tutor Profile Modal */}
          {selectedRequest && (
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300"
              onClick={() => setSelectedRequest(null)}
            >
              <div
                className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Tutor Profile</h4>
                      <p className="text-xl font-black text-gray-900 leading-none mt-1">Matched for {selectedRequest.skillName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all font-black"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                  {/* Tutor Hero */}
                  <div className="flex items-center gap-6 mb-8 p-6 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
                    <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white font-black text-4xl shadow-xl overflow-hidden border-4 border-white">
                      {selectedRequest.tutor?.profilePhoto
                        ? <img src={selectedRequest.tutor.profilePhoto} alt={selectedRequest.tutor?.name} className="w-full h-full object-cover" />
                        : (selectedRequest.tutor?.name?.[0] || 'T')}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-2xl font-black text-gray-900 mb-2">{selectedRequest.tutor?.name}</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.tutor?.rating && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-100">
                             <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                             {selectedRequest.tutor.rating} Rating
                          </span>
                        )}
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-indigo-100">
                          Matched
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedRequest.tutor?.bio && (
                    <div className="mb-8">
                      <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-2">About Tutor</h6>
                      <p className="text-sm text-gray-600 leading-relaxed px-2">{selectedRequest.tutor.bio}</p>
                    </div>
                  )}

                  {/* Demo Video & AI Review */}
                  <div className="mb-8">
                    <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-2">Introductory Demo</h6>
                    {selectedRequest.demoVideo ? (
                      <div>
                        <div className="relative group rounded-[2.5rem] overflow-hidden bg-gray-900 shadow-2xl shadow-indigo-900/10 active:scale-[0.98] transition-all mb-4">
                          <video
                            src={selectedRequest.demoVideo}
                            controls
                            className="w-full aspect-video object-cover"
                          />
                        </div>
                        
                        {reviewError && (
                          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                            {reviewError}
                          </div>
                        )}

                        {!selectedRequest.aiRating && !reviewing && (
                           <button 
                             onClick={() => triggerAIReview(selectedRequest._id)}
                             className="w-full py-4 text-white bg-indigo-600 hover:bg-indigo-700 font-black rounded-2xl transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs flex items-center justify-center gap-2 mb-4 hover:-translate-y-0.5"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                             Analyze Video with AI
                           </button>
                        )}
                        
                        {reviewing && (
                          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                            <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">AI is reviewing video...</p>
                          </div>
                        )}

                        {selectedRequest.aiRating && (
                          <div className="-mt-4">
                            <VideoReviewResult 
                              aiRating={selectedRequest.aiRating} 
                              aiReview={selectedRequest.aiReview} 
                              transcript={selectedRequest.transcript} 
                            />
                            
                            {!reviewing && (
                              <button 
                                onClick={() => triggerAIReview(selectedRequest._id)}
                                className="w-full mt-4 py-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold rounded-xl transition-all border border-indigo-100 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Re-analyze Video
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-[2rem] p-10 text-center border-2 border-dashed border-gray-100 italic">
                        <p className="text-sm text-gray-400 font-bold">Tutor has not uploaded a demo video yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Expertises */}
                  {selectedRequest.tutor?.skills?.length > 0 && (
                    <div className="mb-2">
                       <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-2">Skillsets</h6>
                       <div className="flex flex-wrap gap-2 px-1">
                          {selectedRequest.tutor.skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl uppercase tracking-wider">{s}</span>
                          ))}
                        </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/30">
                  <Link
                    to="/learner/chat"
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Message Tutor
                  </Link>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 py-4 bg-white border border-gray-100 text-gray-500 hover:text-gray-900 font-black text-xs uppercase tracking-widest rounded-[1.5rem] transition-all hover:bg-gray-50"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </main>
    </div>
  </div>
  );
};

export default LearnerDashboard;


