import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar 
} from 'recharts';
import { 
  Ticket, 
  DollarSign, 
  Film, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  X, 
  ArrowUpRight, 
  Plus, 
  QrCode, 
  ShieldCheck, 
  Users, 
  RefreshCw 
} from 'lucide-react';
import getSocket from '../../utils/socket';
import { API_BASE_URL } from '../../api/config';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalMovies: 0, totalBookings: 0, totalRevenue: 0 });
  const [theatersCount, setTheatersCount] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, chartRes, bookingsRes, theatersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/dashboard`),
        axios.get(`${API_BASE_URL}/admin/analytics`),
        axios.get(`${API_BASE_URL}/admin/bookings`),
        axios.get(`${API_BASE_URL}/admin/theaters`)
      ]);

      setStats(dashRes.data || { totalMovies: 0, totalBookings: 0, totalRevenue: 0 });
      setChartData(chartRes.data || []);
      setRecentBookings(bookingsRes.data?.slice(0, 6) || []);
      setTheatersCount(theatersRes.data?.length || 0);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for live bookings via WebSocket
    const socket = getSocket();
    socket.emit('join_admin_feed');

    socket.on('new_live_booking', (booking) => {
      // 1. Update stats dynamically
      setStats((prev) => ({
        ...prev,
        totalBookings: prev.totalBookings + 1,
        totalRevenue: prev.totalRevenue + (booking.amount || 0)
      }));

      // 2. Add to live notification feed
      setLiveAlerts((prev) => [booking, ...prev.slice(0, 3)]);

      // 3. Prepend to recent bookings table
      setRecentBookings((prev) => [
        {
          _id: booking.bookingId || Date.now().toString(),
          movie: { title: booking.movieTitle },
          seats: booking.seats,
          totalAmount: booking.amount,
          createdAt: new Date().toISOString(),
          paymentMethod: 'LIVE',
          user: { email: 'Customer' }
        },
        ...prev.slice(0, 5)
      ]);

      // Auto dismiss notification after 5 seconds
      setTimeout(() => {
        setLiveAlerts((prev) => prev.filter((b) => b.bookingId !== booking.bookingId));
      }, 5000);
    });

    return () => {
      socket.off('new_live_booking');
    };
  }, []);

  const dismissAlert = (id) => {
    setLiveAlerts((prev) => prev.filter((b) => b.bookingId !== id));
  };

  return (
    <div className="space-y-8">
      
      {/* Real-time Floating Notification Toasts */}
      <div className="fixed top-20 right-8 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {liveAlerts.map((alert) => (
          <div 
            key={alert.bookingId} 
            className="pointer-events-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex gap-3 items-start animate-fade-in border-l-4 border-l-[#F84464]"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#F84464] flex items-center justify-center shrink-0 mt-0.5">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F84464] bg-rose-50 px-2 py-0.5 rounded-md">
                  New Admission
                </span>
                <button 
                  onClick={() => dismissAlert(alert.bookingId)} 
                  className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="font-bold text-xs text-gray-900 mt-1 truncate">{alert.movieTitle}</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Seats: <strong className="text-gray-900">{alert.seats?.join(', ')}</strong> • <span className="text-emerald-600 font-bold">₹{alert.amount}</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{alert.theaterName || 'Cinema Property'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 1. TOP METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Gross Revenue Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Gross Box Office Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#F84464] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
              ₹{stats.totalRevenue?.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-time audited collections</span>
            </div>
          </div>
        </div>

        {/* Total Bookings Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Confirmed Admissions
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                {stats.totalBookings?.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Live
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Customer tickets issued across platform
            </p>
          </div>
        </div>

        {/* Verified Theaters Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Partner Theaters
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
              {theatersCount}
            </span>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-500">
              <Link to="/admin/theaters" className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5">
                <span>Manage Cinema Audits</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Catalog Movies Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Active Movie Catalog
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
              {stats.totalMovies}
            </span>
            <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-500">
              <Link to="/admin/add-show" className="text-purple-600 hover:underline font-semibold flex items-center gap-0.5">
                <span>Program New Showtime</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* 2. ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Revenue Velocity (INR)</h3>
              <p className="text-[11px] text-gray-500">Daily ticket booking sales trend</p>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Refresh Analytics"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F84464" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F84464" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#1E222D', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#F84464" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tickets Sold Volume Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Admissions Volume</h3>
              <p className="text-[11px] text-gray-500">Total verified admissions per day</p>
            </div>
            <span className="text-[11px] font-mono text-gray-400 font-semibold">Weekly</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value) => [value, 'Admissions']}
                  contentStyle={{ backgroundColor: '#1E222D', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="tickets" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. RECENT ADMISSIONS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Real Bookings Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Recent Box Office Admissions</h3>
              <p className="text-[11px] text-gray-500">Real-time ledger of latest transactions</p>
            </div>
            <Link 
              to="/admin/bookings" 
              className="text-xs font-bold text-[#F84464] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Movie Title</th>
                  <th className="py-3 px-6">Customer / Email</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No customer bookings recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-gray-900">
                        {b.movie?.title || 'Private Screening'}
                      </td>
                      <td className="py-3.5 px-6 text-gray-500 truncate max-w-[180px]">
                        {b.user?.email || 'Guest User'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-800">
                        {Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold text-gray-900">
                        ₹{(b.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                          b.paymentMethod === 'wallet'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {b.paymentMethod ? b.paymentMethod.toUpperCase() : 'PAID'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations Hub (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-gray-900">Quick Operations</h3>
            <p className="text-[11px] text-gray-500">Direct shortcuts to administrative workflows</p>
            
            <div className="space-y-2.5">
              <Link
                to="/admin/add-show"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#F84464] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Add & Program Show</span>
                    <span className="text-[10px] text-gray-500">Schedule shows across screens</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              </Link>

              <Link
                to="/admin/theaters"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Register Cinema Theater</span>
                    <span className="text-[10px] text-gray-500">Multiplex & single screen onboarding</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              </Link>

              <Link
                to="/admin/scanner"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Validate Admission QR</span>
                    <span className="text-[10px] text-gray-500">Gate ticket scanner</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Security & System Info Card */}
          <div className="bg-[#1A1C24] text-white rounded-2xl p-5 border border-gray-800 shadow-xs text-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">Central Operations Security</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              All box office transactions are cryptographically signed with 256-bit payment verification and synchronized across WebSocket nodes.
            </p>
            <div className="pt-2 border-t border-gray-800 flex justify-between text-[10px] font-mono text-gray-400">
              <span>DB: MongoDB Atlas</span>
              <span className="text-emerald-400">STATUS: HEALTHY</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
