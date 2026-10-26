import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, Film, Plus, Edit2, Trash2, DollarSign, Calendar, Clock, 
  LogOut, CheckCircle, Search, Sparkles, X, Ticket, Radio, Armchair,
  Tv, Layers, QrCode
} from 'lucide-react';
import getSocket from '../../utils/socket';
import { playLiveBookingChime } from '../../utils/audio';
import { API_BASE_URL } from '../../api/config';
import TicketGateScanner from '../../components/TicketGateScanner';

const PROJECTION_FORMATS = [
  'Standard 2D',
  'Dolby Atmos',
  'IMAX 4K Laser',
  '4DX 3D',
  'INSIGNIA / Gold Class Recliner',
  '4K Barco Laser',
  'Onyx Cinema LED',
  'ScreenX (270° Panoramic)',
  'HDR BY BARCO',
  'BARCO 4K LASER',
  'BARCO FLAGSHIP LASER',
  'IMAX 2D'
];

const PartnerDashboard = ({ defaultTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('partner_token');
  const storedUser = localStorage.getItem('partner_user');

  const [partnerData, setPartnerData] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultTab || 'shows'); // 'shows' | 'floor_map' | 'add_movie' | 'scanner'
  const [searchQuery, setSearchQuery] = useState('');
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (params.get('tab') === 'scanner' || location.pathname.includes('/scanner')) {
      setActiveTab('scanner');
    }
  }, [location, defaultTab]);

  // Floor Map Real-Time State
  const [selectedFloorShowtimeId, setSelectedFloorShowtimeId] = useState('');
  const [floorBookedSeats, setFloorBookedSeats] = useState([]);
  const [floorLockedSeats, setFloorLockedSeats] = useState({});
  const [inspectedSeat, setInspectedSeat] = useState(null);
  const [selectedScreenFilter, setSelectedScreenFilter] = useState('ALL');

  // Price Edit Modal State
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [priceForm, setPriceForm] = useState({ pricePremium: '', priceExecutive: '' });
  const [priceUpdating, setPriceUpdating] = useState(false);

  // Add Showtime Modal State
  const [isAddShowModalOpen, setIsAddShowModalOpen] = useState(false);
  const [showForm, setShowForm] = useState({
    movieId: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:20 PM',
    format: 'HDR BY BARCO',
    screen: 'Audi 1',
    pricePremium: 350,
    priceExecutive: 200
  });

  // Add Movie Form State
  const [movieForm, setMovieForm] = useState({
    title: '',
    image: '',
    genre: 'Action/Thriller',
    language: 'Telugu',
    rating: 9.0,
    trailerUrl: ''
  });
  const [movieSubmitting, setMovieSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Partner Theater Data, Showtimes & Movies
  const handleForceReleaseLock = (seatId) => {
    const socket = getSocket();
    socket.emit('force_unlock_seat', {
      showtimeId: selectedFloorShowtimeId,
      seatId,
      partnerName: partnerData?.theater?.name || 'Box Office Supervisor'
    });
    setFloorLockedSeats(prev => {
      const copy = { ...prev };
      delete copy[seatId];
      return copy;
    });
    setInspectedSeat(null);
  };

  const fetchAllData = async () => {
    if (!token) {
      navigate('/partner/login');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [theaterRes, showtimesRes, moviesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/theaters/partner/my-theater`, { headers }),
        axios.get(`${API_BASE_URL}/theaters/partner/showtimes`, { headers }),
        axios.get(`${API_BASE_URL}/movies?all=true`)
      ]);

      setPartnerData(theaterRes.data);
      setShowtimes(showtimesRes.data);
      setMoviesList(moviesRes.data);
      if (moviesRes.data.length > 0) {
        setShowForm(prev => ({ ...prev, movieId: moviesRes.data[0]._id }));
      }
      if (showtimesRes.data.length > 0) {
        setSelectedFloorShowtimeId(showtimesRes.data[0]._id);
      }
      if (theaterRes.data?.theater?.screens?.length > 0) {
        const firstSc = theaterRes.data.theater.screens[0];
        setShowForm(prev => ({
          ...prev,
          screen: firstSc.name,
          format: firstSc.screenType || prev.format
        }));
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem('partner_token');
        navigate('/partner/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Synchronize Floor Map with Real-Time Socket Room
  useEffect(() => {
    if (!selectedFloorShowtimeId) return;

    const fetchFloorSeats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/theaters/showtime/${selectedFloorShowtimeId}/booked-seats`);
        setFloorBookedSeats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFloorSeats();

    const socket = getSocket();
    socket.emit('join_showtime', { showtimeId: selectedFloorShowtimeId, userId: token });

    socket.on('initial_locks', (locks) => {
      setFloorLockedSeats(locks || {});
    });

    socket.on('seat_locked_by_other', ({ seatId, socketId }) => {
      setFloorLockedSeats(prev => ({ ...prev, [seatId]: { socketId } }));
    });

    socket.on('seat_unlocked', ({ seatId }) => {
      setFloorLockedSeats(prev => {
        const copy = { ...prev };
        delete copy[seatId];
        return copy;
      });
    });

    socket.on('seats_released', ({ seats }) => {
      setFloorLockedSeats(prev => {
        const copy = { ...prev };
        (seats || []).forEach(s => delete copy[s]);
        return copy;
      });
    });

    socket.on('demo_state_reset', () => {
      setFloorLockedSeats({});
      fetchFloorSeats();
    });

    socket.on('seats_permanently_booked', ({ seats }) => {
      setFloorBookedSeats(prev => [...new Set([...prev, ...(seats || [])])]);
      setFloorLockedSeats(prev => {
        const copy = { ...prev };
        (seats || []).forEach(s => delete copy[s]);
        return copy;
      });
    });

    return () => {
      socket.off('initial_locks');
      socket.off('seat_locked_by_other');
      socket.off('seat_unlocked');
      socket.off('seats_released');
      socket.off('seats_permanently_booked');
      socket.off('demo_state_reset');
    };
  }, [selectedFloorShowtimeId, token]);

  useEffect(() => {
    fetchAllData();

    // Real-Time Socket Connection for Theater Owner
    const socket = getSocket();
    socket.emit('join_admin_feed');

    socket.on('new_live_booking', (booking) => {
      // Audio notification chime
      playLiveBookingChime();

      // Check if the booking matches this theater
      setPartnerData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            totalBookings: (prev.stats?.totalBookings || 0) + 1,
            totalRevenue: (prev.stats?.totalRevenue || 0) + (booking.amount || 0)
          }
        };
      });

      // Show real-time booking alert
      setLiveAlerts(prev => [booking, ...prev.slice(0, 3)]);
      setTimeout(() => {
        setLiveAlerts(prev => prev.filter(b => b.bookingId !== booking.bookingId));
      }, 6000);
    });

    return () => {
      socket.off('new_live_booking');
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_user');
    navigate('/partner/login');
  };

  // 1. Update Price Handler
  const handleOpenPriceModal = (st) => {
    setEditingShowtime(st);
    setPriceForm({
      pricePremium: st.pricePremium,
      priceExecutive: st.priceExecutive
    });
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    setPriceUpdating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(
        `${API_BASE_URL}/theaters/partner/showtimes/${editingShowtime._id}/price`,
        priceForm,
        { headers }
      );

      // Update in local state
      setShowtimes(prev => prev.map(s => s._id === res.data._id ? { ...s, ...res.data } : s));
      setEditingShowtime(null);
      setSuccessMessage('Ticket prices updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update prices');
    } finally {
      setPriceUpdating(false);
    }
  };

  // 2. Add Showtime Handler
  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_BASE_URL}/theaters/partner/showtimes`, showForm, { headers });
      setShowtimes([res.data, ...showtimes]);
      setIsAddShowModalOpen(false);
      setSuccessMessage('New showtime scheduled successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to schedule showtime');
    }
  };

  // 3. Delete Showtime Handler
  const handleDeleteShowtime = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and remove this showtime?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_BASE_URL}/theaters/partner/showtimes/${id}`, { headers });
      setShowtimes(prev => prev.filter(s => s._id !== id));
      setSuccessMessage('Showtime removed.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert('Failed to remove showtime');
    }
  };

  // 4. Add Movie Handler
  const handleCreateMovie = async (e) => {
    e.preventDefault();
    setMovieSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${API_BASE_URL}/theaters/partner/add-movie`, movieForm, { headers });
      setMoviesList([res.data, ...moviesList]);
      setMovieForm({
        title: '',
        image: '',
        genre: 'Action/Thriller',
        language: 'Telugu',
        rating: 9.0,
        trailerUrl: ''
      });
      setActiveTab('shows');
      setSuccessMessage(`Movie "${res.data.title}" added to catalog & scheduled!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to add movie');
    } finally {
      setMovieSubmitting(false);
    }
  };

  const filteredShowtimes = showtimes.filter(st => {
    const movieTitle = st.movieId?.title || '';
    return movieTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
           st.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
           st.format?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#F5F5F5] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F84464]"></div>
        <p className="text-xs text-gray-500 font-medium">Loading Theater Partner Dashboard...</p>
      </div>
    );
  }

  const theater = partnerData?.theater;
  const stats = partnerData?.stats;

  const theaterScreens = (theater?.screens && theater.screens.length > 0)
    ? theater.screens
    : (theater?.theaterType === 'single_screen'
        ? [{ screenNumber: 1, name: 'Main Screen', screenType: 'Dolby Atmos', capacity: 250 }]
        : [
            { screenNumber: 1, name: 'Audi 1', screenType: 'HDR BY BARCO', capacity: 200 },
            { screenNumber: 2, name: 'Audi 2', screenType: 'DOLBY ATMOS', capacity: 180 },
            { screenNumber: 3, name: 'Audi 3', screenType: 'IMAX 2D', capacity: 250 }
          ]);

  const handleOpenAddShowModal = () => {
    const firstScreen = theaterScreens[0];
    setShowForm(prev => {
      const screenExists = theaterScreens.some(s => s.name === prev.screen);
      const chosen = screenExists ? theaterScreens.find(s => s.name === prev.screen) : firstScreen;
      return {
        ...prev,
        screen: chosen?.name || 'Audi 1',
        format: chosen?.screenType || prev.format || 'Dolby Atmos'
      };
    });
    setIsAddShowModalOpen(true);
  };

  const handleScreenSelect = (screenName) => {
    const matched = theaterScreens.find(s => s.name === screenName);
    setShowForm(prev => ({
      ...prev,
      screen: screenName,
      format: matched?.screenType || prev.format
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#333333] relative">
      
      {/* Real-time Floating Toast for Theater Owner */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {liveAlerts.map((alert) => (
          <div 
            key={alert.bookingId} 
            className="pointer-events-auto bg-white border-l-4 border-[#F84464] rounded-xl shadow-2xl p-4 flex gap-3 items-start animate-fade-in-up border border-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-pink-50 text-[#F84464] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F84464] bg-pink-50 px-2 py-0.5 rounded-full">
                Live Box Office Sale
              </span>
              <h4 className="font-bold text-xs text-gray-900 mt-1">{alert.movieTitle}</h4>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Seats: <strong className="text-gray-900">{alert.seats?.join(', ')}</strong> • <span className="text-green-700 font-bold">₹{alert.amount}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 1. TOP OWNER NAV */}
      <header className="bg-[#1F2533] text-white sticky top-0 z-30 shadow-md">
        <div className="container mx-auto px-4 max-w-7xl h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#F84464]" />
              <div>
                <h1 className="font-bold text-base leading-tight">{theater?.name || 'My Theater'}</h1>
                <p className="text-[11px] text-gray-400">{theater?.location || theater?.city}</p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-[10px] text-green-400 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span>Live Synced</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                activeTab === 'scanner'
                  ? 'bg-[#F84464] text-white border-[#F84464]'
                  : 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
              title="Open Ticket Gate Scanner"
            >
              <QrCode className="w-3.5 h-3.5 text-pink-400" />
              <span>Gate Scanner</span>
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">{theater?.owner?.name || 'Owner Portal'}</p>
              <p className="text-[10px] text-gray-400">{theater?.city}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="container mx-auto px-4 max-w-7xl py-8">
        
        {/* Banner Alert Notification */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold p-4 rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 2. STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Scheduled Shows</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{showtimes.length}</h3>
              <p className="text-[11px] text-gray-500 mt-1">Across all auditorium screens</p>
            </div>
            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-[#F84464]">
              <Film className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 flex items-center justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Bookings</p>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <h3 className="text-3xl font-black text-green-600 mt-1">{stats?.totalBookings || 0}</h3>
              <p className="text-[11px] text-gray-500 mt-1">Real-time box office admissions</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200 flex items-center justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Box Office Revenue</p>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mt-1">₹{stats?.totalRevenue || 0}</h3>
              <p className="text-[11px] text-gray-500 mt-1">Gross theater ticket collections</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* 3. TABS NAVIGATION */}
        <div className="flex justify-between items-center border-b border-gray-200 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('shows')}
              className={`pb-3 text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'shows'
                  ? 'border-b-2 border-[#F84464] text-[#F84464]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Manage Showtimes & Pricing</span>
              <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {showtimes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('floor_map')}
              className={`pb-3 text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'floor_map'
                  ? 'border-b-2 border-[#F84464] text-[#F84464]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Armchair className="w-4 h-4 text-emerald-600" />
              <span>Live Floor Map</span>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                Real-Time
              </span>
            </button>

            <button
              onClick={() => setActiveTab('add_movie')}
              className={`pb-3 text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'add_movie'
                  ? 'border-b-2 border-[#F84464] text-[#F84464]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Add a New Movie</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`pb-3 text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'scanner'
                  ? 'border-b-2 border-[#F84464] text-[#F84464]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#F84464]" />
              <span>Gate Scanner</span>
              <span className="bg-rose-50 text-[#F84464] border border-rose-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                Camera QR
              </span>
            </button>
          </div>

          {activeTab === 'shows' && (
            <button
              onClick={handleOpenAddShowModal}
              className="mb-2 bg-[#F84464] hover:bg-[#d63a56] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Show</span>
            </button>
          )}
        </div>

        {/* 4. TAB 1: SHOWTIMES & LIVE PRICE EDITING */}
        {activeTab === 'shows' && (
          <div>
            {/* Search Filter */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter shows by movie title or time..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464]"
                />
              </div>
              <p className="text-xs text-gray-400">
                Tip: Click <strong>"Update Price"</strong> on any showtime to change ticket rates live.
              </p>
            </div>

            {/* Showtimes Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF9F8] border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold text-[10px]">
                      <th className="py-3.5 px-4">Movie</th>
                      <th className="py-3.5 px-4">Screen</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Format</th>
                      <th className="py-3.5 px-4">Executive Price</th>
                      <th className="py-3.5 px-4">Premium Price</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredShowtimes.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-gray-400">
                          No showtimes found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredShowtimes.slice(0, 50).map((st) => (
                        <tr key={st._id} className="hover:bg-gray-50/70 transition-colors">
                          
                          {/* Movie */}
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={st.movieId?.image}
                              alt={st.movieId?.title}
                              className="w-10 h-14 object-cover rounded-lg shadow-xs bg-gray-100 flex-shrink-0"
                            />
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{st.movieId?.title}</p>
                              <p className="text-[11px] text-gray-400">{st.movieId?.language} • {st.movieId?.genre}</p>
                            </div>
                          </td>

                          {/* Screen */}
                          <td className="py-3 px-4">
                            <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]">
                              {st.screen || 'Audi 1'}
                            </span>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-gray-800">{st.time}</p>
                            <p className="text-gray-400 text-[11px]">
                              {new Date(st.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                          </td>

                          {/* Format */}
                          <td className="py-3 px-4">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              {st.format || 'HDR BY BARCO'}
                            </span>
                          </td>

                          {/* Executive Price */}
                          <td className="py-3 px-4 font-bold text-gray-900">
                            ₹{st.priceExecutive}
                          </td>

                          {/* Premium Price */}
                          <td className="py-3 px-4 font-bold text-[#F84464]">
                            ₹{st.pricePremium}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenPriceModal(st)}
                              className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#F84464]" />
                              <span>Update Price</span>
                            </button>

                            <button
                              onClick={() => handleDeleteShowtime(st._id)}
                              className="inline-flex items-center p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Showtime"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. TAB 2: LIVE BOX OFFICE FLOOR MAP */}
        {activeTab === 'floor_map' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 md:p-8 animate-fade-in">
            
            {/* Screen Filter Chips */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">Filter Screen:</span>
              {['ALL', ...new Set(showtimes.map(s => s.screen || 'Audi 1'))].map(sc => (
                <button
                  key={sc}
                  onClick={() => {
                    setSelectedScreenFilter(sc);
                    const matching = sc === 'ALL' ? showtimes : showtimes.filter(s => (s.screen || 'Audi 1') === sc);
                    if (matching.length > 0 && !matching.some(s => s._id === selectedFloorShowtimeId)) {
                      setSelectedFloorShowtimeId(matching[0]._id);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedScreenFilter === sc
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {sc === 'ALL' ? 'All Auditoriums' : sc}
                </button>
              ))}
            </div>

            {/* Header & Showtime Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Live Floor Map Telemetry
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900">
                  Real-Time Auditorium Seat Occupancy
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Live visual seat states (Available, Customer Held, Booked) updating with zero reload.
                </p>
              </div>

              {/* Showtime Selector Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-600 uppercase">Select Show:</label>
                <select
                  value={selectedFloorShowtimeId}
                  onChange={(e) => setSelectedFloorShowtimeId(e.target.value)}
                  className="px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 bg-gray-50 outline-none focus:border-[#F84464] cursor-pointer"
                >
                  {(selectedScreenFilter === 'ALL' ? showtimes : showtimes.filter(s => (s.screen || 'Audi 1') === selectedScreenFilter)).map(s => (
                    <option key={s._id} value={s._id}>
                      {s.movieId?.title} • {s.screen || 'Audi 1'} • {s.time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Occupancy Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Capacity</span>
                <span className="text-2xl font-black text-gray-800">120 Seats</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block">Confirmed Booked</span>
                <span className="text-2xl font-black text-emerald-700">{floorBookedSeats.length} Seats</span>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold uppercase text-amber-600 block">Live Holds (Active)</span>
                <span className="text-2xl font-black text-amber-700">{Object.keys(floorLockedSeats).length} Held</span>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold uppercase text-blue-600 block">Live Occupancy</span>
                <span className="text-2xl font-black text-blue-700">
                  {Math.round(((floorBookedSeats.length + Object.keys(floorLockedSeats).length) / 120) * 100)}%
                </span>
              </div>
            </div>

            {/* Live Seating Grid */}
            <div className="overflow-x-auto py-6 flex flex-col items-center bg-slate-50/50 rounded-2xl border border-gray-100">
              
              {/* Screen Arc */}
              <div className="w-full flex flex-col items-center mb-8">
                <div className="relative w-full max-w-lg flex justify-center">
                  <svg className="w-full h-8" viewBox="0 0 500 50" preserveAspectRatio="none">
                    <path
                      d="M 20 40 Q 250 10 480 40"
                      fill="transparent"
                      stroke="#94a3b8"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-1">
                  Projection Screen
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 text-xs text-gray-600 mb-6 flex-wrap justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border border-green-500 bg-white"></span>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 animate-pulse"></span>
                  <span className="font-bold text-amber-700">Held by Customer (Live)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-gray-800 text-white"></span>
                  <span className="font-bold text-gray-800">Sold Out (Occupied)</span>
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row) => (
                  <div key={row} className="flex items-center justify-center gap-1.5">
                    <span className="w-6 text-xs font-bold text-gray-400 text-center">{row}</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5, '', 6, 7, 8, 9, 10, 11, 12, '', 13, 14, 15].map((col, idx) => {
                        if (col === '') return <div key={`sp-${idx}`} className="w-4" />;
                        const seatId = `${row}${col}`;
                        const isBooked = floorBookedSeats.includes(seatId);
                        const isHeld = Boolean(floorLockedSeats[seatId]);

                        let classes = "w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center transition-all ";
                        if (isBooked) {
                          classes += "bg-gray-800 text-white border border-gray-900 shadow-xs";
                        } else if (isHeld) {
                          classes += "bg-amber-100 border-2 border-amber-500 text-amber-900 animate-pulse font-black";
                        } else {
                          classes += "bg-white border border-green-500/80 text-green-800";
                        }

                        return (
                          <button 
                            key={seatId} 
                            onClick={() => {
                              setInspectedSeat({
                                seatId,
                                isBooked,
                                isHeld,
                                holder: floorLockedSeats[seatId]?.userLabel || 'Customer'
                              });
                            }}
                            className={`${classes} cursor-pointer hover:ring-2 hover:ring-[#F84464] active:scale-95`}
                            title={`Seat ${seatId}: ${isBooked ? 'Sold Out' : isHeld ? 'Held by Customer (Click to Inspect/Override)' : 'Available (Click to Inspect)'}`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Interactive Box Office Seat Inspector & Force Release Override */}
            {inspectedSeat && (
              <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    inspectedSeat.isBooked ? 'bg-gray-800 text-white' : inspectedSeat.isHeld ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {inspectedSeat.seatId}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span>Seat {inspectedSeat.seatId}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                        inspectedSeat.isBooked ? 'bg-gray-100 text-gray-700' : inspectedSeat.isHeld ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {inspectedSeat.isBooked ? 'Sold Out' : inspectedSeat.isHeld ? 'Held in Real-Time' : 'Available'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {inspectedSeat.isHeld 
                        ? `Held by: ${inspectedSeat.holder} (Checkout in progress)` 
                        : inspectedSeat.isBooked 
                        ? 'Confirmed box office admission ticket' 
                        : 'Open capacity ready for booking'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {inspectedSeat.isHeld && (
                    <button
                      onClick={() => handleForceReleaseLock(inspectedSeat.seatId)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Force Release Lock</span>
                    </button>
                  )}
                  <button
                    onClick={() => setInspectedSeat(null)}
                    className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 5. TAB 2: ADD A NEW MOVIE */}
        {activeTab === 'add_movie' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs max-w-2xl mx-auto">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900">Publish a New Movie to Theater</h3>
              <p className="text-xs text-gray-500">
                Add a new movie release to your theater's schedule and make it discoverable to customers in {theater?.city}.
              </p>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Movie Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pushpa 2: The Rule"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#F84464]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Language *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telugu, Hindi"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#F84464]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Genre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Action/Thriller"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Poster Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  value={movieForm.image}
                  onChange={(e) => setMovieForm({ ...movieForm, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#F84464]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Rating (out of 10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#F84464]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    YouTube Trailer Embed URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/embed/..."
                    value={movieForm.trailerUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={movieSubmitting}
                className="w-full bg-[#F84464] hover:bg-[#d63a56] text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-pink-500/20 transition-all cursor-pointer mt-4"
              >
                {movieSubmitting ? 'Publishing Movie...' : 'Publish Movie to Theater Catalog'}
              </button>
            </form>
          </div>
        )}

        {/* 5. TAB 4: GATE SECURITY & QR CAMERA SCANNER */}
        {activeTab === 'scanner' && (
          <div className="animate-fade-in">
            <TicketGateScanner userRole="partner" currentTheater={theater} />
          </div>
        )}

      </main>

      {/* 6. MODAL: UPDATE PRICE */}
      {editingShowtime && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-base text-gray-900">Update Ticket Prices</h3>
                <p className="text-xs text-gray-500">
                  {editingShowtime.movieId?.title} • {editingShowtime.time}
                </p>
              </div>
              <button 
                onClick={() => setEditingShowtime(null)}
                className="text-gray-400 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Executive Class Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="2000"
                  value={priceForm.priceExecutive}
                  onChange={(e) => setPriceForm({ ...priceForm, priceExecutive: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-800 outline-none focus:border-[#F84464]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Premium Class Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="3000"
                  value={priceForm.pricePremium}
                  onChange={(e) => setPriceForm({ ...priceForm, pricePremium: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-[#F84464] outline-none focus:border-[#F84464]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingShowtime(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={priceUpdating}
                  className="flex-1 py-2.5 bg-[#F84464] hover:bg-[#d63a56] text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition-all"
                >
                  {priceUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 7. MODAL: SCHEDULE NEW SHOWTIME */}
      {isAddShowModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-base text-gray-900">Schedule New Showtime</h3>
                <p className="text-xs text-gray-500">{theater?.name}</p>
              </div>
              <button 
                onClick={() => setIsAddShowModalOpen(false)}
                className="text-gray-400 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShowtime} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Select Movie *
                </label>
                <select
                  required
                  value={showForm.movieId}
                  onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#F84464]"
                >
                  {moviesList.map(m => (
                    <option key={m._id} value={m._id}>{m.title} ({m.language})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={showForm.date}
                    onChange={(e) => setShowForm({ ...showForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#F84464]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Showtime *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 07:30 PM"
                    value={showForm.time}
                    onChange={(e) => setShowForm({ ...showForm, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>

              {/* Theater Screen Architecture Banner */}
              <div className="p-2.5 rounded-xl border flex items-center justify-between text-xs bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2">
                  {theater?.theaterType === 'single_screen' ? (
                    <>
                      <span className="p-1 rounded-md bg-purple-100 text-purple-700">
                        <Tv className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-bold text-gray-800">Single Screen Cinema</span>
                        <p className="text-[10px] text-gray-500">Hall: {theaterScreens[0]?.name || 'Main Screen'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="p-1 rounded-md bg-blue-100 text-blue-700">
                        <Layers className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-bold text-gray-800">Multiplex Cinema</span>
                        <p className="text-[10px] text-gray-500">{theaterScreens.length} configured auditoriums</p>
                      </div>
                    </>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Screen Synced
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Auditorium Screen *
                  </label>
                  <select
                    value={showForm.screen}
                    onChange={(e) => handleScreenSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#F84464] bg-white cursor-pointer font-medium"
                  >
                    {theaterScreens.map((s, idx) => (
                      <option key={s.screenNumber || idx} value={s.name}>
                        {s.name} ({s.screenType || 'Standard'} • {s.capacity || 200} seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Projection Format
                  </label>
                  <select
                    value={showForm.format}
                    onChange={(e) => setShowForm({ ...showForm, format: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#F84464] bg-white cursor-pointer font-medium"
                  >
                    {[...new Set([showForm.format, ...theaterScreens.map(s => s.screenType), ...PROJECTION_FORMATS].filter(Boolean))].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Executive (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    value={showForm.priceExecutive}
                    onChange={(e) => setShowForm({ ...showForm, priceExecutive: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#F84464]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Premium (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    value={showForm.pricePremium}
                    onChange={(e) => setShowForm({ ...showForm, pricePremium: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#F84464] hover:bg-[#d63a56] text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-pink-500/20 transition-all cursor-pointer mt-2"
              >
                Publish Showtime
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PartnerDashboard;
