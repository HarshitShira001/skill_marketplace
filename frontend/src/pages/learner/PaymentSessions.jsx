import { useState, useEffect } from 'react';
import Sidebar from '../../layout/Sidebar';
import Navbar from '../../layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const SOCKET_URL = 'http://localhost:5000';

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const PaymentSessions = () => {
  const { token, user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${SOCKET_URL}/api/users/accepted-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSessions(res.data || []);
      } catch { setSessions([]); }
      finally { setLoading(false); }
    };
    if (token) fetchData();
  }, [token]);

  const unpaid = sessions.filter(s => s.paymentStatus === 'none');
  const session = unpaid[0];

  // Billing breakdown: derive hours & hourly rate from budget
  const totalAmount = session?.budget || 500;
  const hours = 1;
  const ratePerHour = totalAmount;
  const platformFee = 0;

  const handlePay = async () => {
    if (!session) return;
    setPaying(true);
    const loaded = await loadRazorpay();
    if (!loaded) { alert('Razorpay SDK failed to load.'); setPaying(false); return; }
    try {
      const orderRes = await axios.post(`${SOCKET_URL}/api/payments/initiate`,
        { amount: totalAmount, receipt: `receipt_${session._id}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const options = {
        key: 'rzp_test_SPmp7NV9xRxWb8',
        amount: orderRes.data.amount,
        currency: orderRes.data.currency || 'INR',
        name: 'GigSpark',
        description: 'Session Payment',
        order_id: orderRes.data.id,
        handler: async (response) => {
          try {
            const v = await axios.post(`${SOCKET_URL}/api/payments/verify`, response, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (v.data.status === 'success') {
              setSessions(prev => prev.map(s => s._id === session._id ? { ...s, paymentStatus: 'held' } : s));
              alert('Payment successful! Funds are held in escrow.');
            }
          } catch { alert('Payment verification failed.'); }
        },
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#16a34a' },
        modal: { ondismiss: () => setPaying(false) }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally { setPaying(false); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-72 flex items-center justify-center p-10">

        {loading ? (
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl p-10 animate-pulse space-y-5">
            {[1,2,3,4].map(i => <div key={i} className="h-6 bg-gray-100 rounded-lg" />)}
          </div>
        ) : !session ? (
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-black text-gray-900 text-xl">All Paid!</p>
            <p className="text-gray-400 text-sm">No pending payments right now.</p>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">

            {/* Green Header Strip */}
            <div className="bg-emerald-600 px-10 py-6 flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-[11px] font-bold uppercase tracking-widest">GigSpark</p>
                <h2 className="text-white font-black text-2xl tracking-tight mt-0.5">Session Invoice</h2>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-[11px] font-bold uppercase tracking-widest">Invoice Date</p>
                <p className="text-white font-black text-sm mt-0.5">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Billing Breakdown */}
            <div className="px-10 py-8 space-y-0">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 pb-3 border-b-2 border-emerald-600">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest col-span-2">Description</p>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Hours</p>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</p>
              </div>

              {/* Row */}
              <div className="grid grid-cols-4 gap-4 py-5 border-b border-gray-100">
                <div className="col-span-2">
                  <p className="font-black text-gray-900 text-base">Skill Session</p>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">1:1 live tutoring session</p>
                </div>
                <p className="text-gray-700 font-bold text-center self-center">{hours} hr</p>
                <p className="text-gray-900 font-black text-right self-center">₹{ratePerHour}</p>
              </div>

              {/* Rate per hour row */}
              <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100">
                <div className="col-span-2">
                  <p className="text-gray-500 font-bold text-sm">Rate per Hour</p>
                </div>
                <p className="text-gray-500 font-bold text-center self-center text-sm">×{hours}</p>
                <p className="text-gray-700 font-black text-right self-center">₹{ratePerHour}/hr</p>
              </div>

              {/* Platform fee */}
              <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100">
                <div className="col-span-2">
                  <p className="text-gray-500 font-bold text-sm">Platform Fee</p>
                </div>
                <p className="text-gray-400 text-center self-center text-sm">—</p>
                <p className="text-emerald-600 font-black text-right self-center text-sm">Free</p>
              </div>

              {/* Total */}
              <div className="grid grid-cols-4 gap-4 pt-5">
                <div className="col-span-2" />
                <p className="text-gray-900 font-black text-right col-span-1 self-center">Total Due</p>
                <p className="text-emerald-600 font-black text-right text-2xl tracking-tight self-center">₹{totalAmount}</p>
              </div>
            </div>

            {/* Escrow note + CTA */}
            <div className="px-10 pb-8 space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-emerald-700 text-sm font-semibold">
                  Payment is held in <span className="font-black">secure escrow</span> and released to the tutor only after you confirm session completion.
                </p>
              </div>

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {paying ? 'Opening Payment...' : `Make Payment  ₹${totalAmount}`}
              </button>

              <p className="text-center text-[11px] text-gray-400 font-medium">
                🔒 Secured by Razorpay · 256-bit SSL · UPI, Cards & Netbanking accepted
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSessions;


