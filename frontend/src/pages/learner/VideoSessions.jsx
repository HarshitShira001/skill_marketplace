import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';

const SOCKET_URL = 'http://localhost:5000';
const AGORA_APP_ID = '9474adec4dbc415bac9980a3a5beae89';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const demoSession = {
  _id: 'demo',
  skillName: 'React.js',
  tutor: { name: 'Tutor', _id: 'demo-tutor' },
  budget: 500,
};

const VideoSessions = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [activeCall, setActiveCall] = useState(null); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completionRequest, setCompletionRequest] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const socketRef = useRef(null);
  const callContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const selfVideoRef = useRef(null);
  const location = useLocation();
  const autoJoinId = location.state?.requestId;

  // No longer using manual getUserMedia, Agora handles it.
  // But we still use localStreamRef for the preview if needed, 
  // though Agora is better.

  // Sync video ref when stream is ready
  const attachSelfVideo = (el) => {
    selfVideoRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
    }
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.on('status_updated', ({ requestId, status }) => {
      setSessions(prev => prev.map(s => s._id === requestId ? { ...s, paymentStatus: status } : s));
    });
    // Join active call room so tutor completion request reaches us
    const rid = activeCall?._id || activeCall?.id;
    if (rid) socketRef.current.emit('join_room', rid);
    // Listen for tutor's session completion request
    socketRef.current.on('session_completion_requested', ({ requestId }) => {
      setCompletionRequest({ requestId });
    });
    return () => socketRef.current?.disconnect();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${SOCKET_URL}/api/users/accepted-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data || []);
    } catch (err) {
      console.error('Error fetching video sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSessions();
  }, [token]);

  const handleConfirmCompletion = async (requestId) => {
    if (confirming) return;
    setConfirming(true);
    try {
      await axios.put(`${SOCKET_URL}/api/payments/confirm-completion/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      socketRef.current.emit('payment_status_change', { requestId, status: 'released' });
      setSessions(prev => prev.map(s => s._id === requestId ? { ...s, paymentStatus: 'released' } : s));
      alert('Payment confirmed and released! Thank you.');
    } catch (err) {
      console.error('Confirm completion error:', err);
      alert('Failed to confirm completion.');
    } finally {
      setConfirming(false);
    }
  };

  const handleJoinSession = async (session) => {
    setActiveCall(session);
    setIsMuted(false);
    setIsVideoOff(false);
    try {
      const res = await axios.post(`${SOCKET_URL}/api/sessions/agora-token`,
        { channelName: `request_${session._id || session.id}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { token: agoraToken } = res.data;
      
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') setRemoteUsers(prev => [...prev, user]);
        if (mediaType === 'audio') user.audioTrack.play();
      });

      client.on('user-unpublished', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      await client.join(AGORA_APP_ID, `request_${session._id || session.id}`, agoraToken, null);
      const [localAudio, localVideo] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalVideoTrack(localVideo);
      await client.publish([localAudio, localVideo]);
      
      if (selfVideoRef.current) localVideo.play(selfVideoRef.current);
    } catch (err) {
      console.error('Join Agora session error:', err);
    }
  };

  const handleEndCall = async () => {
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    await client.leave();
    setLocalVideoTrack(null);
    setRemoteUsers([]);
    setActiveCall(null);
    if (document.fullscreenElement) document.exitFullscreen();
    navigate('/learner/dashboard');
  };

  useEffect(() => {
    if (autoJoinId && sessions.length > 0) {
      const sess = sessions.find(s => s._id === autoJoinId);
      if (sess) handleJoinSession(sess);
    }
  }, [autoJoinId, sessions]);

  const handleAcceptCompletion = async () => {
    if (!completionRequest) return;
    try {
      await axios.put(`${SOCKET_URL}/api/payments/confirm-completion/${completionRequest.requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      socketRef.current?.emit('accept_session_completion', { requestId: completionRequest.requestId });
      socketRef.current?.emit('payment_status_change', { requestId: completionRequest.requestId, status: 'released' });
      setCompletionRequest(null);
      alert('Session marked as complete. Thank you!');
    } catch (err) {
      console.error('Accept completion error:', err);
    }
  };

  const handleDeclineCompletion = async () => {
    if (!completionRequest) return;
    try {
      await axios.put(`${SOCKET_URL}/api/payments/decline-completion/${completionRequest.requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      socketRef.current?.emit('decline_session_completion', { requestId: completionRequest.requestId });
      socketRef.current?.emit('payment_status_change', { requestId: completionRequest.requestId, status: 'declined' });
      setCompletionRequest(null);
      alert('Completion request declined.');
    } catch (err) {
      console.error('Decline completion error:', err);
    }
  };

  const handleToggleMute = () => {
    // Agora mute
    client.localTracks.forEach(track => {
      if (track.trackMediaType === 'audio') track.setEnabled(isMuted);
    });
    setIsMuted(!isMuted);
  };

  const handleToggleCamera = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(isVideoOff);
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      callContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ─── IN-CALL VIEW ────────────────────────────────────────────────────────────
  if (activeCall) {
    const tutorInitial = activeCall.tutor?.name?.[0]?.toUpperCase() || 'T';
    const learnerInitial = 'L';

    return (
      <div
        ref={callContainerRef}
        className="fixed inset-0 bg-[#080810] z-[999] flex flex-col"
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-sm">{activeCall.skillName} Session</p>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">with {activeCall.tutor?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Main Video Area — large remote feed */}
        <div className="flex-1 relative bg-[#0d0d18] overflow-hidden">
          {/* Remote (Tutor) — large */}
          <div className="absolute inset-0 flex items-center justify-center">
            {remoteUsers.length > 0 ? (
              <div
                className="w-full h-full"
                ref={(el) => remoteUsers[0]?.videoTrack?.play(el)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#12082b] to-[#0a0a1a] flex items-center justify-center relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="flex flex-col items-center gap-6">
                  <div className="w-36 h-36 rounded-[3rem] bg-indigo-600/20 border-2 border-indigo-500/20 flex items-center justify-center text-white text-6xl font-black">
                    {tutorInitial}
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-2xl">{activeCall.tutor?.name || 'Tutor'}</p>
                    <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mt-1">Tutor · Waiting for video...</p>
                  </div>
                </div>
              </div>
            )}
            {/* Remote video placeholder label */}
            <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="text-white text-xs font-bold">{activeCall.tutor?.name || 'Tutor'}</span>
            </div>
          </div>

          {/* Completion Modal Overlay */}
          {completionRequest && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-[8px]">
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
              <div className="bg-[#1a1a2e]/90 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-indigo-500/30 text-center relative z-10 animate-in zoom-in slide-in-from-bottom-10 duration-500 ease-out">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-emerald-500/30">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white mb-2 tracking-tight">Session Finished?</h3>
                <p className="text-gray-400 text-sm font-bold mb-8 leading-relaxed px-2">
                  Tutor {activeCall.tutor?.name} has marked this as complete. Accept to release the held payment.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAcceptCompletion}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Accept & Release
                  </button>
                  <button
                    onClick={handleDeclineCompletion}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-white/5"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Self (Learner) — PiP */}
          <div className="absolute bottom-28 right-6 w-80 h-60 rounded-[2rem] overflow-hidden border border-indigo-500/20 bg-[#1a1a2e] shadow-2xl shadow-indigo-900/30 ring-1 ring-white/5 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" style={{boxShadow: '0 0 40px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.5)'}}>
            {/* Real camera feed */}
            <div
              ref={(el) => {
                if (el && localVideoTrack) localVideoTrack.play(el);
              }}
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
            />
            {isVideoOff && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-3xl bg-gray-700 flex items-center justify-center text-white text-3xl font-black">{learnerInitial}</div>
                <span className="text-xs text-gray-400 font-bold">Camera Off</span>
              </div>
            )}
            <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-full text-[9px] text-white font-black uppercase tracking-widest">You</div>
          </div>
        </div>

        {/* Bottom Controls — 3 buttons with labels */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-8 pb-8 pt-20 bg-gradient-to-t from-black/80 to-transparent">

          {/* Mic */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl ${
                isMuted ? 'bg-red-500/90 shadow-red-500/30' : 'bg-white/10 hover:bg-white/15 border border-white/10'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMuted
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />}
              </svg>
            </button>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-300'
            }`}>{isMuted ? 'Unmute' : 'Mic On'}</span>
          </div>

          {/* Camera */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleToggleCamera}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl ${
                isVideoOff ? 'bg-red-500/90 shadow-red-500/30' : 'bg-white/10 hover:bg-white/15 border border-white/10'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isVideoOff
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M3 3l18 18" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />}
              </svg>
            </button>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-300'
            }`}>{isVideoOff ? 'Cam Off' : 'Cam On'}</span>
          </div>

          {/* End Call */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-2xl bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-xl shadow-red-600/40"
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
              </svg>
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400">End Call</span>
          </div>

          {/* Fullscreen */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleToggleFullscreen}
              className="w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l-3-3m0 0l3-3m-3 3h3m9 9l3 3m0 0l-3 3m3-3h-3M9 15l-3 3m0 0l3 3m-3-3h3M15 9l3-3m0 0l-3-3m3 3h-3" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />}
              </svg>
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
              {isFullscreen ? 'Exit Full' : 'Fullscreen'}
            </span>
          </div>

        </div>
      </div>
    );
  }

  // ─── SESSION LIST VIEW ────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <div className="fixed left-0 top-0 h-full z-50">
        <Sidebar minimal={true} />
      </div>
      <div className="flex-1 ml-72">
        {/* Dark Navbar */}
        <div className="sticky top-0 z-40 px-10 py-5 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/learner/dashboard')}
              className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
            </button>
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white font-black text-base tracking-tight">Video Sessions</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Sessions Active
          </div>
        </div>

        <main className="p-10">
          {/* Hero Banner */}
          <div className="relative mb-12 rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#1a0533] via-[#12082b] to-[#0a0a1a] border border-white/5 p-10">
            <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Live Video Sessions</h1>
                <p className="text-gray-500 text-sm font-medium mt-1">Connect face-to-face with your tutors in real-time</p>
                <div className="flex items-center gap-6 mt-6 text-xs">
                  {['End-to-end encrypted', 'HD Video & Audio', 'Powered by Agora RTC'].map((text) => (
                    <div key={text} className="flex items-center gap-2 text-gray-400 font-bold">
                      <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sessions */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-white font-black text-xl tracking-tight">Your Sessions</h2>
            <span className="text-gray-600 text-xs font-black uppercase tracking-widest">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 rounded-[2.5rem] border border-white/5 p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/10" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-white/10 rounded-full w-3/4" />
                      <div className="h-2 bg-white/10 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="h-12 bg-white/10 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-28 h-28 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-indigo-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-white font-black text-2xl mb-3">No Sessions Yet</h4>
              <p className="text-gray-500 text-sm font-medium max-w-sm mb-8">Your video sessions will appear here once a tutor has accepted your skill request and payment is made.</p>
              <div className="flex gap-4">
                <Link to="/learner/chat" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-indigo-900/30">Go to Chat</Link>
                <Link to="/learner/request-skill" className="bg-white/5 hover:bg-white/10 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all">Post a Request</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sessions.map((s, i) => {
                const isPaid = ['held', 'completion_requested', 'released'].includes(s.paymentStatus);
                const isCompleted = s.paymentStatus === 'released';
                return (
                  <div key={i} className={`group relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
                    isCompleted ? 'bg-white/3 border-white/5' :
                    isPaid ? 'bg-gradient-to-br from-[#111128] to-[#0d0d20] border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-900/30' :
                    'bg-white/3 border-white/5 opacity-60'
                  }`}>
                    {isPaid && !isCompleted && (
                      <div className="absolute top-5 right-5 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Ready</span>
                      </div>
                    )}
                    <div className="p-7 space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-white font-black text-xl flex-shrink-0 overflow-hidden">
                          {s.tutor?.profilePhoto
                            ? <img src={s.tutor.profilePhoto} alt={s.tutor?.name} className="w-full h-full object-cover" />
                            : (s.tutor?.name?.[0]?.toUpperCase() || 'T')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-black text-base truncate">{s.tutor?.name || 'Tutor'}</p>
                          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest truncate">{s.skillName}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl">
                          <span className="text-gray-500 text-xs font-bold">Session Fee</span>
                          <span className="text-white font-black text-sm">₹{s.budget || 500}</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl">
                          <span className="text-gray-500 text-xs font-bold">Status</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            isCompleted ? 'text-emerald-400' :
                            s.paymentStatus === 'completion_requested' ? 'text-indigo-400' :
                            isPaid ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {isCompleted ? 'Completed ✓' :
                             s.paymentStatus === 'completion_requested' ? 'Confirm Completion' :
                             isPaid ? 'Paid · Ready to Join' : 'Payment Required'}
                          </span>
                        </div>
                      </div>
                      {s.paymentStatus === 'completion_requested' && (
                        <div className="mt-2 p-4 bg-indigo-600 rounded-2xl flex flex-col items-center gap-3 text-center">
                          <p className="text-white font-black text-xs">Tutor requested completion</p>
                          <button
                            onClick={(e) => { e.preventDefault(); handleConfirmCompletion(s._id); }}
                            disabled={confirming}
                            className="w-full bg-white text-indigo-600 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all"
                          >
                            {confirming ? '...' : 'Accept & Release'}
                          </button>
                        </div>
                      )}
                      {isCompleted ? (
                        <div className="w-full py-3.5 rounded-2xl bg-white/5 text-gray-500 font-black text-xs uppercase tracking-widest text-center">Session Ended</div>
                      ) : isPaid ? (
                        <button
                          onClick={() => handleJoinSession(s)}
                          className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-900/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Join Session
                        </button>
                      ) : (
                        <Link
                          to="/learner/payments"
                          className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 flex items-center justify-center gap-2"
                        >
                          Pay to Unlock
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VideoSessions;
