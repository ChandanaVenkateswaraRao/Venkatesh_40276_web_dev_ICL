import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Ticket, 
  Search, 
  DollarSign, 
  Film, 
  Calendar, 
  Clock, 
  RefreshCw,
  Wallet,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

const Listbookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/bookings`);
      setBookings(res.data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const movieTitle = b.movie?.title?.toLowerCase() || '';
    const userEmail = b.user?.email?.toLowerCase() || '';
    const id = b._id?.toLowerCase() || '';
    const paymentId = b.paymentId?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();

    return movieTitle.includes(q) || userEmail.includes(q) || id.includes(q) || paymentId.includes(q);
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalSeats = bookings.reduce((sum, b) => sum + (Array.isArray(b.seats) ? b.seats.length : 1), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-[#F84464] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-medium">Loading admissions ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Confirmed Admissions
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono">
              {bookings.length} Bookings
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">{totalSeats} Total Seats Reserved</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#F84464] flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Audited Gross Revenue
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono">
              ₹{totalRevenue.toLocaleString()}
            </span>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified Collections</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Average Transaction
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono">
              ₹{bookings.length > 0 ? Math.round(totalRevenue / bookings.length).toLocaleString() : 0}
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">Per order basket size</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Header with Search and Refresh */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Live Customer Admissions Ledger</h2>
            <p className="text-[11px] text-gray-500">Search and audit all confirmed movie ticket transactions</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search booking ID, movie, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white w-64"
              />
            </div>

            <button
              onClick={fetchBookings}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Refresh Ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[10px] border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Booking Reference</th>
                <th className="py-3 px-6">Movie Programmed</th>
                <th className="py-3 px-6">Customer Email</th>
                <th className="py-3 px-4">Reserved Seats</th>
                <th className="py-3 px-6 text-right">Amount (₹)</th>
                <th className="py-3 px-6">Payment Mode</th>
                <th className="py-3 px-6 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No bookings found matching your search.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                    
                    {/* Booking Reference */}
                    <td className="py-3.5 px-6 font-mono font-medium text-gray-900">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] text-gray-700">
                        {b._id?.slice(-8).toUpperCase()}
                      </span>
                    </td>

                    {/* Movie Programmed */}
                    <td className="py-3.5 px-6 font-semibold text-gray-900">
                      {b.movie?.title || 'Private Screening'}
                    </td>

                    {/* Customer Email */}
                    <td className="py-3.5 px-6 text-gray-500 truncate max-w-[200px]">
                      {b.user?.email || 'Guest User'}
                    </td>

                    {/* Reserved Seats */}
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-6 text-right font-mono font-black text-gray-900">
                      ₹{(b.totalAmount || 0).toLocaleString()}
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                        b.paymentMethod === 'wallet'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {b.paymentMethod === 'wallet' ? <Wallet className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                        <span>{b.paymentMethod ? b.paymentMethod.toUpperCase() : 'PAID'}</span>
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-6 text-right text-gray-400 text-[11px] font-mono">
                      {new Date(b.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default Listbookings;
