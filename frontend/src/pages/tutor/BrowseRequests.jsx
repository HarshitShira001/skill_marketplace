import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../layout/Sidebar';
import Navbar from '../../layout/Navbar';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const BrowseRequests = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // requestId being acted upon

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/open-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error('Error fetching skill requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token]);

  const handleAccept = async (request) => {
    setActionLoading(request._id + '_accept');
    try {
      await axios.put(
        `http://localhost:5000/api/users/skill-requests/${request._id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Remove from list and navigate to demo upload page
      setRequests(prev => prev.filter(r => r._id !== request._id));
      navigate(`/tutor/demo-upload/${request._id}/${encodeURIComponent(request.skillName)}`);
    } catch (err) {
      console.error('Accept error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading(requestId + '_reject');
    try {
      await axios.put(
        `http://localhost:5000/api/users/skill-requests/${requestId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-72">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900">Skill Requests</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">Browse and respond to learner skill requests</p>
            </div>
            <span className="text-sm font-black bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl">
              {requests.length} Open
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full" />
                    <div className="space-y-2">
                      <div className="w-24 h-3 bg-gray-100 rounded-full" />
                      <div className="w-16 h-2 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                  <div className="w-40 h-4 bg-gray-100 rounded-full mb-2" />
                  <div className="w-full h-3 bg-gray-100 rounded-full mb-1" />
                  <div className="w-3/4 h-3 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {requests.length > 0 ? (
                requests.map((r) => (
                  <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                    {/* Learner Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                          {r.learner?.profilePhoto
                            ? <img src={r.learner.profilePhoto} alt={r.learner.name} className="w-full h-full object-cover rounded-full" />
                            : r.learner?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-gray-800 text-sm">{r.learner?.name}</p>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Learner</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                        ${r.budget}/hr
                      </span>
                    </div>

                    {/* Request Details */}
                    <h4 className="font-black text-gray-900 text-base mb-1">{r.skillName}</h4>
                    <p className="text-sm text-gray-500 mb-2 leading-relaxed line-clamp-2">{r.description}</p>
                    {r.preferredTime && (
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Preferred: {r.preferredTime}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => handleAccept(r)}
                        disabled={actionLoading !== null}
                        className={`flex-1 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 uppercase tracking-widest active:scale-95 ${actionLoading === r._id + '_accept' ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {actionLoading === r._id + '_accept' ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleReject(r._id)}
                        disabled={actionLoading !== null}
                        className={`flex-1 py-2.5 bg-white border border-red-200 text-red-600 text-xs font-black rounded-2xl hover:bg-red-50 transition-colors uppercase tracking-widest ${actionLoading === r._id + '_reject' ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {actionLoading === r._id + '_reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="lg:col-span-2 py-16 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-black text-sm uppercase tracking-widest">No open skill requests at the moment</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BrowseRequests;


