import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Ticket, Printer, CheckCircle } from 'lucide-react';
import TicketPassModal from '../components/TicketPassModal';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPassBooking, setSelectedPassBooking] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F84464]"></div>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="bg-[#F5F5F5] min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* User Info Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 mb-8 flex items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F84464] text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
            {profile.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#333333]">{profile.user.name}</h1>
            <p className="text-gray-500 text-sm">{profile.user.email}</p>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold mt-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified BookMyShow Member</span>
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <h2 className="text-xl font-bold text-[#333333] mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#F84464]" /> Your Movie Tickets
        </h2>

        {profile.bookings.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
            You haven't booked any tickets yet. Explore movies on the homepage to book!
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {profile.bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                <div className="w-full md:w-48 h-56 md:h-auto bg-gray-200 flex-shrink-0">
                  <img src={booking.movie.image} alt={booking.movie.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-[#333333] mb-1">{booking.movie.title}</h3>
                      <button
                        onClick={() => setSelectedPassBooking(booking)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#F84464] border border-[#F84464] hover:bg-pink-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Ticket Pass</span>
                      </button>
                    </div>

                    <p className="text-gray-500 text-xs mb-4">Booked on: {new Date(booking.createdAt).toLocaleString()}</p>
                    
                    <div className="flex gap-8 mb-4">
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Seats</p>
                        <p className="font-bold text-base text-[#333333]">{booking.seats.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Amount Paid</p>
                        <p className="font-bold text-base text-[#1EA83C]">₹{booking.totalAmount}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-dashed border-gray-300">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Booking ID</p>
                      <p className="font-mono text-xs text-gray-700 break-all">{booking._id}</p>
                    </div>
                  </div>
                </div>
                
                {/* QR Code display */}
                <div className="p-6 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col items-center justify-center min-w-[200px]">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=TICKET:${booking._id}`} alt="QR Code" className="border-4 border-white shadow-xs rounded mb-2 bg-white" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center mt-1">Scan at Cinema</p>
                  <button
                    onClick={() => setSelectedPassBooking(booking)}
                    className="text-xs text-[#F84464] hover:underline mt-2 font-semibold"
                  >
                    View E-Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official E-Ticket Pass Modal */}
      <TicketPassModal
        isOpen={!!selectedPassBooking}
        onClose={() => setSelectedPassBooking(null)}
        booking={selectedPassBooking}
      />
    </div>
  );
};

export default Profile;
