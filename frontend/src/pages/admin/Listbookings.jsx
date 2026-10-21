import { useState, useEffect } from 'react';
import axios from 'axios';

const Listbookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/bookings');
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <div className="p-8">Loading bookings...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="p-4 font-medium border-b border-gray-100">Booking ID</th>
              <th className="p-4 font-medium border-b border-gray-100">Movie</th>
              <th className="p-4 font-medium border-b border-gray-100">User Email</th>
              <th className="p-4 font-medium border-b border-gray-100">Seats</th>
              <th className="p-4 font-medium border-b border-gray-100">Total (₹)</th>
              <th className="p-4 font-medium border-b border-gray-100">Date</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {bookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50 border-b border-gray-50">
                <td className="p-4 font-mono text-gray-900 text-xs">{b._id}</td>
                <td className="p-4 text-gray-700 font-medium">{b.movie?.title || 'Unknown'}</td>
                <td className="p-4 text-gray-600">{b.user?.email || 'Unknown'}</td>
                <td className="p-4 text-gray-700 font-semibold">{b.seats.length} ({b.seats.join(', ')})</td>
                <td className="p-4 text-[#1EA83C] font-semibold">₹{b.totalAmount}</td>
                <td className="p-4 text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Listbookings;
