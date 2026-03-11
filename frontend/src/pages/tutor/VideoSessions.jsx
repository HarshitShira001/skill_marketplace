import { useState, useRef, useEffect } from 'react';
import Sidebar from '../../layout/Sidebar';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate, useLocation } from 'react-router-dom';

const SOCKET_URL = 'http://localhost:5000';

const AGORA_APP_ID = '9474adec4dbc415bac9980a3a5beae89';

const initialSessions = [
  { id: 1, student: 'Alice Johnson', skill: 'React.js', time: 'Today, 3:00 PM', duration: '60 min', status: 'upcoming', avatar: 'A' },
  { id: 2, student: 'Bob Smith', skill: 'Python', time: 'Live Now', duration: '45 min', status: 'active', avatar: 'B' },
  { id: 3, student: 'Carol Davis', skill: 'UI Design', time: 'Tomorrow, 2:00 PM', duration: '90 min', status: 'upcoming', avatar: 'C' },
  { id: 4, student: 'David Lee', skill: 'Node.js', time: 'Wed, 11:00 AM', duration: '60 min', status: 'upcoming', avatar: 'D' },
];

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const demoSession = {
  id: 'demo',
  student: 'Student',
  skill: 'React.js',
  status: 'active',
  avatar: 'S',
};

const VideoSessions = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeCall, setActiveCall] = useState(null); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const callContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const selfVideoRef = useRef(null);
  const socketRef = useRef(null);
  const location = useLocation();
  const autoJoinId = location.state?.requestId;
  const [completionState, setCompletionState] = useState('idle'); // idle | requesting | accepted | declined
  const [activeRequestId, setActiveRequestId] = useState(autoJoinId || activeCall?._id || activeCall?.id || null);

  // Socket connection and session room join
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    const rid = activeRequestId;
    if (rid) {
      socketRef.current.emit('join_room', rid);
    }
    // Listen for learner's accept
    socketRef.current.on('session_completion_accepted', () => {
      setCompletionState('accepted');
    });
    // Listen for learner's decline
    socketRef.current.on('session_completion_declined', () => {
      setCompletionState('declined');
    });
    return () => socketRef.current?.disconnect();
  }, [activeRequestId]);

  // Start camera when call starts
  useEffect(() => {
    if (activeCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localStreamRef.current = stream;
          if (selfVideoRef.current) selfVideoRef.current.srcObject = stream;
        })
        .catch(err => console.warn('Camera access denied:', err));
      return () => { localStreamRef.current?.getTracks().forEach(t => t.stop()); };
    }
  }, [activeCall]);

  const attachSelfVideo = (el) => {
    selfVideoRef.current = el;
    if (el && localStreamRef.current) el.srcObject = localStreamRef.current;
  };

  const handleToggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    setIsMuted(!isMuted);
  };

  const handleToggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = isVideoOff; });
    setIsVideoOff(!isVideoOff);
  };

  const handleJoinSession = async (session) => {
    setActiveCall(session);
    setIsMuted(false);
    setIsVideoOff(false);
    try {
      const channelName = `request_${session._id || session.id || session.requestId}`;
      const res = await axios.post('http://localhost:5000/api/sessions/agora-token',
        { channelName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { token: agoraToken } = res.data;
      await client.join(AGORA_APP_ID, channelName, agoraToken, null);
      const localAudio = await AgoraRTC.createMicrophoneAudioTrack();
      const localVideo = await AgoraRTC.createCameraVideoTrack();
      setLocalVideoTrack(localVideo);
      await client.publish([localAudio, localVideo]);
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') setRemoteUsers(prev => [...prev, user]);
        if (mediaType === 'audio') user.audioTrack.play();
      });
      client.on('user-unpublished', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndCall = async () => {
    if (localVideoTrack) { localVideoTrack.stop(); localVideoTrack.close(); }
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    await client.leave();
    setLocalVideoTrack(null);
    setRemoteUsers([]);
    setActiveCall(null);
    if (document.fullscreenElement) document.exitFullscreen();
    navigate('/tutor/dashboard');
  };

  // Auto-join if requestId provided in state
  useEffect(() => {
    if (autoJoinId) {
      // Create a mock session object if we don't have the full details yet
      // or if it's coming from chat where we just have the ID.
      // Ideally we'd fetch the session details, but for now we'll join.
      const mockSession = { _id: autoJoinId, student: 'Learner', skill: 'Session' };
      handleJoinSession(mockSession);
    }
  }, [autoJoinId]);

  const handleRequestCompletion = async () => {
    setCompletionState('requesting');
    const rid = activeCall?._id || activeCall?.id;
    try {
      if (rid && rid !== 'demo') {
        await axios.put(`${SOCKET_URL}/api/payments/request-completion/${rid}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // Notify learner via socket
      socketRef.current?.emit('request_session_completion', { requestId: rid, tutorName: 'Tutor' });
    } catch (err) {
      console.error('Completion request error:', err);
      setCompletionState('idle');
    }
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
    const studentInitial = activeCall.avatar || activeCall.student?.[0]?.toUpperCase() || 'S';
    const tutorInitial = 'T';

    return (
      <div ref={callContainerRef} className="fixed inset-0 bg-[#080810] z-[999] flex flex-col">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-sm">{activeCall.skill} Session</p>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">with {activeCall.student}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Main Video — large student feed */}
        <div className="flex-1 relative bg-[#0d0d18] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {remoteUsers.length > 0 ? (
              <div
                className="w-full h-full"
                ref={(el) => remoteUsers[0]?.videoTrack?.play(el)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#12082b] to-[#0a0a1a] flex items-center justify-center relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="flex flex-col items-center gap-6">
                  <div className="w-36 h-36 rounded-[3rem] bg-violet-600/20 border-2 border-violet-500/20 flex items-center justify-center text-white text-6xl font-black">
                    {studentInitial}
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-2xl">{activeCall.student}</p>
                    <p className="text-violet-400 text-xs font-black uppercase tracking-widest mt-1">Student · Waiting to join...</p>
                  </div>
                </div>
              </div>
            )}
            <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
              <span className="text-white text-xs font-bold">{activeCall.student}</span>
            </div>
          </div>

          {/* Self (Tutor) — PiP */}
          <div className="absolute bottom-28 right-6 w-80 h-60 rounded-[2rem] overflow-hidden border border-indigo-500/20 bg-[#1a1a2e] shadow-2xl shadow-indigo-900/30 ring-1 ring-white/5 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer" style={{boxShadow: '0 0 40px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.5)'}}>
            {/* Real camera feed */}
            <video
              ref={attachSelfVideo}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
            />
            {isVideoOff && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-3xl bg-gray-700 flex items-center justify-center text-white text-3xl font-black">{tutorInitial}</div>
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

          {/* Complete Session */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={completionState === 'idle' ? handleRequestCompletion : undefined}
              disabled={completionState !== 'idle'}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                completionState === 'idle'
                  ? 'bg-emerald-600 hover:bg-emerald-700 hover:scale-110 active:scale-90 shadow-emerald-600/40'
                  : completionState === 'accepted'
                  ? 'bg-emerald-500/30 cursor-not-allowed'
                  : completionState === 'declined'
                  ? 'bg-red-500/30 cursor-not-allowed'
                  : 'bg-yellow-600/50 cursor-not-allowed animate-pulse'
              }`}
            >
              {completionState === 'accepted' ? (
                <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : completionState === 'declined' ? (
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              )}
            </button>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              completionState === 'idle' ? 'bg-emerald-500/20 text-emerald-400' :
              completionState === 'requesting' ? 'bg-yellow-500/20 text-yellow-400' :
              completionState === 'accepted' ? 'bg-emerald-500/20 text-emerald-300' :
              'bg-red-500/20 text-red-400'
            }`}>
              {completionState === 'idle' ? 'Complete' :
               completionState === 'requesting' ? 'Waiting...' :
               completionState === 'accepted' ? 'Accepted!' :
               'Declined'}
            </span>
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
      <Sidebar minimal={true} />
      <div className="flex-1 ml-72">
        {/* Dark Header */}
        <div className="sticky top-0 z-40 px-10 py-5 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/tutor/dashboard')}
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
              <h3 className="text-white font-black text-base tracking-tight">Video Sessions</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            Active
          </div>
        </div>

        <main className="p-10">
          {/* Hero Banner */}
          <div className="relative mb-12 rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#1a0533] via-[#12082b] to-[#0a0a1a] border border-white/5 p-10">
            <div className="absolute top-0 left-0 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <h1 className="text-4xl font-black text-white tracking-tight">Your Student Sessions</h1>
              <p className="text-gray-500 text-sm font-medium mt-1">Host and manage your face-to-face teaching sessions</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-white font-black text-xl tracking-tight">Upcoming & Active</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {initialSessions.map(s => (
              <div key={s.id} className={`relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden p-8 hover:-translate-y-1 ${s.status === 'active' ? 'bg-gradient-to-br from-[#111128] to-[#0d0d20] border-indigo-500/30 shadow-2xl shadow-indigo-500/10' : 'bg-white/3 border-white/5'}`}>
                {s.status === 'active' && (
                  <div className="absolute top-5 right-5 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Live Now</span>
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-violet-600/30 border border-violet-500/20 flex items-center justify-center text-white font-black text-xl">
                    {s.avatar}
                  </div>
                  <div>
                    <p className="font-black text-white text-base">{s.student}</p>
                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{s.skill}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl">
                    <span className="text-gray-500 text-xs font-bold">Time</span>
                    <span className="text-white font-black text-xs">{s.time}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl">
                    <span className="text-gray-500 text-xs font-bold">Duration</span>
                    <span className="text-white font-black text-xs">{s.duration}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinSession(s)}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${s.status === 'active' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-900/40' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                >
                  {s.status === 'active' ? 'Join Session' : 'Start Session'}
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default VideoSessions;
