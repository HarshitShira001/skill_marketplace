import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../layout/Sidebar';
import Navbar from '../../layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const SOCKET_URL = 'http://localhost:5000';

const RatingPage = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('Please select a rating');

    setSubmitting(true);
    try {
      await axios.post(`${SOCKET_URL}/api/reviews`, 
        { tutorId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Thank you for your feedback! Your rating helps the community.');
      navigate('/learner/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fcfcfd]">
      <Sidebar />
      <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 p-10 flex items-center justify-center bg-gray-50/30 overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-gray-100 p-12 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10 opacity-50" />
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">How was your session?</h2>
              <p className="text-gray-400 mt-3 text-sm font-medium">Your feedback helps us maintain high quality tutoring on GigSpark.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`text-5xl transition-all duration-300 transform hover:scale-125 active:scale-95 ${
                        (hover || rating) >= star ? 'text-amber-400 drop-shadow-lg' : 'text-gray-100'
                      }`}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
                  {rating === 1 && 'Needs Improvement'}
                  {rating === 2 && 'Fair Experience'}
                  {rating === 3 && 'Good Session'}
                  {rating === 4 && 'Great Tutor!'}
                  {rating === 5 && 'Absolutely Amazing!'}
                  {!rating && 'Select a star'}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Tell us more</label>
                <textarea
                  className="w-full h-36 p-6 rounded-[28px] border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all text-sm font-semibold text-gray-800 placeholder:text-gray-300 leading-relaxed resize-none"
                  placeholder="What did you learn? How was the tutor's teaching style?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-black hover:bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RatingPage;


