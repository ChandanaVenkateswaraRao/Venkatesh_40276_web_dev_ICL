import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Radio, Ticket, DollarSign, Bell, X, CheckCircle, Sparkles, Terminal, Play, Pause, Trash2, ArrowUpRight } from 'lucide-react';
import getSocket from '../../utils/socket';
import { playLiveBookingChime } from '../../utils/audio';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalMovies: 0, totalBookings: 0, totalRevenue: 0 });
  const [chartData, setChartData] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Telemetry Audit Log State
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'init_1',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'CONNECT',
      message: 'Telemetry audit stream initialized. Connected to primary cluster.'
    }
  ]);
  const [isAuditPaused, setIsAuditPaused] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, chartRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/dashboard'),
          axios.get('http://localhost:5000/api/admin/analytics')
        ]);
        setStats(dashRes.data);
        setChartData(chartRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    // Setup Real-Time Socket Connection
    const socket = getSocket();
    socket.emit('join_admin_feed');
    setIsConnected(true);

    socket.on('new_live_booking', (booking) => {
      // Audio notification chime
      playLiveBookingChime();

      // 1. Update stats in real-time
      setStats(prev => ({
        ...prev,
        totalBookings: prev.totalBookings + 1,
        totalRevenue: prev.totalRevenue + (booking.amount || 0)
      }));

      // 2. Add to live notification feed
      setLiveAlerts(prev => [booking, ...prev.slice(0, 4)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setLiveAlerts(prev => prev.filter(b => b.bookingId !== booking.bookingId));
      }, 6000);
    });

    // 3. Streaming Audit Events
    socket.on('admin_audit_event', (event) => {
      if (!isAuditPaused) {
        setAuditLogs(prev => [...prev.slice(-80), event]);
      }
    });

    return () => {
      socket.off('new_live_booking');
      socket.off('admin_audit_event');
    };
  }, [isAuditPaused]);

  useEffect(() => {
    if (!isAuditPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [auditLogs, isAuditPaused]);

  const dismissAlert = (id) => {
    setLiveAlerts(prev => prev.filter(b => b.bookingId !== id));
  };

  // Launch 1-Click Live Rush Simulator
  const handleSimulateRush = async () => {
    setSimulating(true);
    try {
      const res = await axios.post('http://localhost:5000/api/admin/simulate-rush');
      setAuditLogs(prev => [
        ...prev,
        {
          id: `sim_launch_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          type: 'SIMULATE',
          message: `Live Rush Simulation launched: 3 concurrent bots targeting "${res.data.showtime?.movie}" at ${res.data.showtime?.theater}`
        }
      ]);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to trigger simulation');
    } finally {
      setTimeout(() => setSimulating(false), 9000);
    }
  };

  return (
    <div className="relative">
      
      {/* Real-time Floating Notification Toasts */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {liveAlerts.map((alert) => (
          <div 
            key={alert.bookingId} 
            className="pointer-events-auto bg-white border-l-4 border-green-500 rounded-xl shadow-2xl p-4 flex gap-3 items-start animate-fade-in-up border border-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  Real-time Booking
                </span>
                <button onClick={() => dismissAlert(alert.bookingId)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="font-bold text-xs text-gray-900 mt-1">{alert.movieTitle}</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Seats: <span className="font-bold text-gray-800">{alert.seats?.join(', ')}</span> • <span className="text-green-700 font-bold">₹{alert.amount}</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{alert.theaterName || 'Cinema Screen'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header with Live Sync Status & Simulator Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-xs text-gray-500">Real-time box office monitoring & audience metrics</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Rush Simulator Button for Presentations */}
          <button
            onClick={handleSimulateRush}
            disabled={simulating}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Spawns 3 virtual concurrent users booking tickets in real-time"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Simulating Live Traffic...' : 'Simulate Live Rush (Demo)'}</span>
          </button>

          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full text-xs font-bold text-green-700">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
            <span>WebSocket Live Sync</span>
          </div>
        </div>
      </div>
      
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-2">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Catalog Movies</span>
          <span className="text-3xl font-black text-[#F84464]">{stats.totalMovies}</span>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Total Bookings</span>
            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">Live</span>
          </span>
          <span className="text-3xl font-black text-[#1EA83C]">{stats.totalBookings}</span>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Platform Revenue</span>
            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">Live</span>
          </span>
          <span className="text-3xl font-black text-[#333333]">₹{stats.totalRevenue}</span>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 h-96">
          <h3 className="font-bold text-sm text-gray-700 mb-6">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F84464" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F84464" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip cursor={{ stroke: '#F84464', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="revenue" stroke="#F84464" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 h-96">
          <h3 className="font-bold text-sm text-gray-700 mb-6">Tickets Sold Trend</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#F3F4F6' }} />
              <Bar dataKey="tickets" fill="#1EA83C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-Time WebSocket Telemetry Audit Log Terminal */}
      <div className="mt-8 bg-[#0F172A] rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-white tracking-tight">
                  Real-Time WebSocket Event Stream (Audit Log)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE FEED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                Streaming reactive concurrency events, atomic lock acquisitions, and box office admissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuditPaused(!isAuditPaused)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                isAuditPaused 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isAuditPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isAuditPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={() => setAuditLogs([])}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Clear Terminal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="mt-4 font-mono text-xs max-h-72 overflow-y-auto space-y-2 pr-2">
          {auditLogs.map((log) => {
            let badgeBg = 'bg-slate-800 text-slate-300';
            if (log.type === 'LOCK') badgeBg = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
            if (log.type === 'BOOK') badgeBg = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
            if (log.type === 'RELEASE') badgeBg = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
            if (log.type === 'SIMULATE') badgeBg = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
            if (log.type === 'CONNECT') badgeBg = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';

            return (
              <div key={log.id} className="flex items-start gap-2.5 py-0.5 leading-relaxed hover:bg-slate-800/40 px-2 rounded">
                <span className="text-slate-500 shrink-0 font-sans text-[11px]">[{log.timestamp}]</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wider ${badgeBg}`}>
                  {log.type}
                </span>
                <span className="text-slate-300 break-words">{log.message}</span>
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
