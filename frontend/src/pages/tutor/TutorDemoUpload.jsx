import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../layout/Sidebar';
import Navbar from '../../layout/Navbar';
import { useAuth } from '../../context/AuthContext';

const TutorDemoUpload = () => {
  const { requestId, skillName } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a video file.');
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('video', file);

    try {
      await axios.post(
        `http://localhost:5000/api/users/skill-requests/${requestId}/demo-video`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setUploaded(true);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const decodedSkill = decodeURIComponent(skillName || 'Skill');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-72">
        <main className="p-6 max-w-2xl">

          {/* Header */}
          <div className="mb-8 p-8 bg-gradient-to-br from-[#4338ca] via-[#3730a3] to-[#312e81] rounded-[2rem] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative z-10">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">Request Accepted</p>
              <h2 className="text-3xl font-black mb-1 tracking-tight">Upload Demo Video</h2>
              <p className="text-indigo-200 text-sm font-medium">Skill: <span className="text-white font-black">{decodedSkill}</span></p>
            </div>
          </div>

          {/* Success State */}
          {uploaded ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-black text-gray-900 mb-2">Demo Video Uploaded!</h4>
              <p className="text-sm text-gray-500 font-medium mb-8">
                The learner can now view your demo. Ready to start the session?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/tutor/chat')}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all uppercase text-xs tracking-widest hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Go to Chat Sessions
                </button>
                <button
                  onClick={() => navigate('/tutor/browse-requests')}
                  className="w-full py-3 text-gray-500 font-bold text-sm hover:text-gray-700 transition-colors"
                >
                  Back to Requests
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
              <form onSubmit={handleUpload} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-sm font-bold text-red-600">{error}</p>
                  </div>
                )}

                {/* File Drop Zone */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-widest">
                    Select Demo Video
                  </label>
                  <label className="block w-full cursor-pointer border-2 border-dashed border-indigo-200 rounded-2xl hover:border-indigo-400 transition-colors bg-indigo-50/30 hover:bg-indigo-50/60">
                    <div className="p-10 text-center">
                      {file ? (
                        <div>
                          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.95 4.95a7 7 0 11-9.9-9.9L15 10z" />
                            </svg>
                          </div>
                          <p className="text-sm font-black text-gray-800">{file.name}</p>
                          <p className="text-xs text-gray-400 mt-1 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="text-sm font-black text-gray-700">Click to upload a video</p>
                          <p className="text-xs text-gray-400 mt-1 font-medium">MP4, MOV, AVI up to 100MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Video Preview */}
                {preview && (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                    <video src={preview} controls className="w-full max-h-64 object-contain bg-black" />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className={`w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest ${(uploading || !file) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
                >
                  {uploading ? 'Uploading...' : 'Upload Demo Video'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/tutor/browse-requests')}
                  className="w-full py-3 text-gray-500 font-bold text-sm hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TutorDemoUpload;


