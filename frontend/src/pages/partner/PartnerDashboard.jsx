import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, Film, Plus, Edit2, Trash2, Calendar, Clock, 
  LogOut, CheckCircle, Search, X, Ticket, Armchair,
  Tv, Layers, QrCode, AlertCircle, AlertTriangle
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
  'INSIGNIA Recliner',
  '4K Barco Laser',
  'Onyx Cinema LED',
  'HDR BY BARCO',
  'BARCO 4K LASER',
  'IMAX 2D'
];

const PartnerDashboard = ({ defaultTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('partner_token');

  const [partnerData, setPartnerData] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultTab || 'shows');
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
    startDate: new Date().toISOString().split('T')[0],
    days: 7,
    times: ['11:00 AM', '02:30 PM', '06:30 PM', '09:45 PM'],
    format: 'Dolby Atmos',
    screen: 'Screen 1',
    pricePremium: 350,
    priceExecutive: 200
  });
  const [customTime, setCustomTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

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

  // Force release seat lock via supervisor override
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

    const socket = getSocket();
    socket.emit('join_admin_feed');

    socket.on('new_live_booking', (booking) => {
      playLiveBookingChime();

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

      setLiveAlerts(prev => [booking, ...prev.slice(0, 3)]);
      setTimeout(() => {
        setLiveAlerts(prev => prev.filter(b => b.bookingId !== booking.bookingId));
      }, 5000);
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

      setShowtimes(prev => prev.map(s => s._id === res.data._id ? { ...s, ...res.data } : s));
      setEditingShowtime(null);
      setSuccessMessage('Ticket prices updated successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update prices');
    } finally {
      setPriceUpdating(false);
    }
  };

  // Helper date and conflict functions for scheduling
  const computeEndDate = (startStr, numDays) => {
    if (!startStr) return '';
    try {
      const parts = startStr.split('-');
      const d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) + (Math.max(1, Number(numDays)) - 1)));
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const computeStartDateFormatted = (startStr) => {
    if (!startStr) return '';
    try {
      const parts = startStr.split('-');
      const d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const checkScheduleConflicts = () => {
    if (!showForm.startDate || !showForm.days || !showForm.times || showForm.times.length === 0) {
      return [];
    }
    const isSingleScreenMode = partnerData?.theater?.theaterType === 'single_screen';
    const conflicts = [];
    const targetScreen = isSingleScreenMode 
      ? (partnerData?.theater?.screens?.[0]?.name || 'Main Screen') 
      : (showForm.screen || 'Screen 1');

    const numDays = Math.max(1, Math.min(30, Number(showForm.days) || 1));
    const dateList = [];
    for (let i = 0; i < numDays; i++) {
      const parts = showForm.startDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10) + i;
      const curDate = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
      dateList.push(curDate);
    }

    for (const d of dateList) {
      const dString = d.toISOString().split('T')[0];
      for (const t of showForm.times) {
        const match = showtimes.find(st => {
          const stDate = new Date(st.date);
          const stDateStr = `${stDate.getUTCFullYear()}-${String(stDate.getUTCMonth() + 1).padStart(2, '0')}-${String(stDate.getUTCDate()).padStart(2, '0')}`;
          const isDateEqual = stDateStr === dString;
          const isTimeEqual = st.time && st.time.trim().toLowerCase() === t.trim().toLowerCase();
          if (isSingleScreenMode) {
            return isDateEqual && isTimeEqual;
          } else {
            return isDateEqual && isTimeEqual && (st.screen === targetScreen);
          }
        });

        if (match) {
          conflicts.push({
            dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: t,
            screen: targetScreen,
            existingMovie: match.movieId?.title || 'Another Movie'
          });
        }
      }
    }
    return conflicts;
  };

  // 2. Add Showtime Handler (Multi-Day & Conflict Enforced)
  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    setScheduleError('');

    const selectedMovieId = showForm.movieId || (moviesList.length > 0 ? moviesList[0]._id : '');
    if (!selectedMovieId) {
      setScheduleError('Please select a movie to schedule.');
      return;
    }
    if (!showForm.times || showForm.times.length === 0) {
      setScheduleError('Please select or add at least one daily showtime slot.');
      return;
    }

    const currentConflicts = checkScheduleConflicts();
    const isSingleScreenMode = partnerData?.theater?.theaterType === 'single_screen';

    if (currentConflicts.length > 0) {
      setScheduleError(
        isSingleScreenMode
          ? `Single-Screen Conflict: Only one movie can play at a time across this theater. ${currentConflicts.length} of your selected slots conflict with existing shows.`
          : `Multiplex Conflict: Screen "${showForm.screen}" already has movies scheduled for ${currentConflicts.length} of your selected slots.`
      );
      return;
    }

    setScheduleSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const targetScreen = isSingleScreenMode 
        ? (partnerData?.theater?.screens?.[0]?.name || 'Main Screen') 
        : (showForm.screen || 'Screen 1');

      const numDays = Math.max(1, Math.min(30, Number(showForm.days) || 1));
      const firstTime = (showForm.times && showForm.times.length > 0) ? showForm.times[0] : '12:20 PM';

      // Always supply date and time for 100% backward compatibility with legacy endpoints
      const payload = {
        movieId: selectedMovieId,
        date: showForm.startDate,
        time: firstTime,
        startDate: showForm.startDate,
        days: numDays,
        times: showForm.times,
        format: showForm.format || 'Dolby Atmos',
        screen: targetScreen,
        pricePremium: Number(showForm.pricePremium) || 350,
        priceExecutive: Number(showForm.priceExecutive) || 200
      };

      const res = await axios.post(`${API_BASE_URL}/theaters/partner/showtimes`, payload, { headers });

      let createdShows = [];
      if (res.data.showtimes && Array.isArray(res.data.showtimes)) {
        // Modern backend returned all batch-scheduled showtimes
        createdShows = res.data.showtimes;
      } else if (res.data && res.data._id) {
        // Legacy backend fallback (single show returned): create remaining slots if requested
        createdShows = [res.data];

        if (numDays > 1 || showForm.times.length > 1) {
          const dateList = [];
          for (let i = 0; i < numDays; i++) {
            const parts = showForm.startDate.split('-');
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10) + i;
            const curDate = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
            dateList.push(curDate.toISOString().split('T')[0]);
          }

          for (const d of dateList) {
            for (const t of showForm.times) {
              if (d === showForm.startDate && t === firstTime) continue; // Already created by initial call
              try {
                const subRes = await axios.post(`${API_BASE_URL}/theaters/partner/showtimes`, {
                  movieId: showForm.movieId,
                  date: d,
                  time: t,
                  startDate: d,
                  days: 1,
                  times: [t],
                  format: showForm.format || 'Dolby Atmos',
                  screen: targetScreen,
                  pricePremium: Number(showForm.pricePremium) || 350,
                  priceExecutive: Number(showForm.priceExecutive) || 200
                }, { headers });
                if (subRes.data && subRes.data._id) {
                  createdShows.push(subRes.data);
                }
              } catch (subErr) {
                console.warn('Slot creation note:', subErr.message);
              }
            }
          }
        }
      }

      setShowtimes(prev => [...createdShows, ...prev]);

      if (!selectedFloorShowtimeId && createdShows.length > 0) {
        setSelectedFloorShowtimeId(createdShows[0]._id);
      }

      setIsAddShowModalOpen(false);
      setSuccessMessage(`Successfully scheduled ${createdShows.length} showtime(s) across ${showForm.days} day(s).`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      const errMsg = err.response?.data?.msg || err.response?.data?.message || 'Failed to schedule showtime';
      setScheduleError(errMsg);
    } finally {
      setScheduleSubmitting(false);
    }
  };

  // 3. Delete Showtime Handler
  const handleDeleteShowtime = async (id) => {
    if (!window.confirm('Are you sure you want to remove this showtime from the schedule?')) return;
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
      setSuccessMessage(`Movie "${res.data.title}" added to theater catalog.`);
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
           st.format?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           st.screen?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 gap-3">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-[#F84464] rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-600">Loading Theater Dashboard...</p>
      </div>
    );
  }

  const theater = partnerData?.theater;
  const stats = partnerData?.stats;
  const isSingleScreen = theater?.theaterType === 'single_screen';

  const theaterScreens = (theater?.screens && theater.screens.length > 0)
    ? theater.screens
    : (isSingleScreen
        ? [{ screenNumber: 1, name: 'Main Screen', screenType: 'Dolby Atmos', capacity: 250 }]
        : [
            { screenNumber: 1, name: 'Screen 1', screenType: 'Dolby Atmos', capacity: 200 },
            { screenNumber: 2, name: 'Screen 2', screenType: '4K Barco Laser', capacity: 180 },
            { screenNumber: 3, name: 'Screen 3', screenType: 'IMAX 2D', capacity: 250 }
          ]);

  const currentConflicts = checkScheduleConflicts();

  // Seating Layout Tiers matching user Booking.jsx exactly
  const reclinerRows = ['A', 'B'];
  const primeRows = ['C', 'D', 'E', 'F'];
  const classicRows = ['G', 'H', 'I', 'J'];
  const cols = [1, 2, 3, 4, 5, '', 6, 7, 8, 9, 10, 11, 12, '', 13, 14, 15, 16, 17];
  const reclinerCols = [1, 2, '', 3, 4, '', 5, 6, '', 7, 8, '', 9, 10];

  const totalSeatsCount = (reclinerRows.length * 10) + (primeRows.length * 16) + (classicRows.length * 16); // 148 seats
  const heldCount = Object.keys(floorLockedSeats).length;
  const bookedCount = floorBookedSeats.length;
  const availableCount = Math.max(0, totalSeatsCount - bookedCount - heldCount);

  const currentFloorShowtime = showtimes.find(s => s._id === selectedFloorShowtimeId);
  const floorPricePremium = currentFloorShowtime?.pricePremium || 350;
  const floorPriceExecutive = currentFloorShowtime?.priceExecutive || 200;
  const floorPriceRecliner = floorPricePremium + 120;

  const handleOpenAddShowModal = () => {
    setScheduleError('');
    setCustomTime('');
    const firstScreen = theaterScreens[0];
    setShowForm(prev => {
      const screenExists = theaterScreens.some(s => s.name === prev.screen);
      const chosen = screenExists ? theaterScreens.find(s => s.name === prev.screen) : firstScreen;
      return {
        ...prev,
        movieId: prev.movieId || (moviesList.length > 0 ? moviesList[0]._id : ''),
        startDate: prev.startDate || new Date().toISOString().split('T')[0],
        days: prev.days || 7,
        times: (prev.times && prev.times.length > 0) ? prev.times : ['11:00 AM', '02:30 PM', '06:30 PM', '09:45 PM'],
        screen: theater?.theaterType === 'single_screen' ? (theaterScreens[0]?.name || 'Main Screen') : (chosen?.name || 'Screen 1'),
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
    setScheduleError('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#F84464] selection:text-white">
      
      {/* Real-time Floating Live Sale Toast */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {liveAlerts.map((alert) => (
          <div 
            key={alert.bookingId} 
            className="pointer-events-auto bg-white border-l-4 border-[#F84464] rounded-lg shadow-xl p-4 flex gap-3 items-start border border-slate-200 animate-fade-in-up"
          >
            <div className="w-8 h-8 rounded-full bg-rose-50 text-[#F84464] flex items-center justify-center shrink-0 mt-0.5">
              <Ticket className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F84464]">
                New Ticket Booking
              </span>
              <h4 className="font-bold text-xs text-slate-900 mt-0.5">{alert.movieTitle}</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Seats: <strong className="text-slate-900">{alert.seats?.join(', ')}</strong> &bull; <span className="text-emerald-600 font-bold">₹{alert.amount}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* TOP CLEAN ENTERPRISE HEADER */}
      <header className="bg-[#1F2533] text-white sticky top-0 z-30 shadow-md">
        <div className="container mx-auto px-4 max-w-7xl h-16 flex items-center justify-between">
          
          {/* Cinema Name & Location */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F84464] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-white leading-tight">
                  {theater?.name || 'Asian Cinemas'}
                </h1>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-medium border border-slate-700">
                  {theater?.theaterType === 'single_screen' ? 'Single Screen' : 'Multiplex'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {theater?.location || theater?.city || 'Musapet Y Junction, Hyderabad'}
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                activeTab === 'scanner'
                  ? 'bg-[#F84464] text-white border-[#F84464]'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
              title="Ticket Gate Scanner"
            >
              <QrCode className="w-4 h-4" />
              <span>Gate Scanner</span>
            </button>

            <div className="hidden sm:block text-right border-l border-slate-700 pl-3">
              <p className="text-xs font-semibold text-white">{theater?.owner?.name || 'Theater Partner'}</p>
              <p className="text-[10px] text-slate-400">{theater?.city || 'Hyderabad'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container mx-auto px-4 max-w-7xl py-6">
        
        {/* Banner Alert Notification */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-lg flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. CLEAN EXECUTIVE METRICS SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Shows</p>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="text-3xl font-bold text-slate-900">{showtimes.length}</h3>
              <span className="text-xs text-slate-500 font-medium">{theaterScreens.length} Screen{theaterScreens.length > 1 ? 's' : ''}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Currently listed on platform</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tickets Booked</p>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="text-3xl font-bold text-emerald-600">{stats?.totalBookings || 0}</h3>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Live</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Total customer admissions</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Box Office Revenue</p>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="text-3xl font-bold text-slate-900">₹{stats?.totalRevenue || 0}</h3>
              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">Gross</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Total ticket sales collection</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Floor Occupancy</p>
            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="text-3xl font-bold text-slate-900">
                {Math.round(((floorBookedSeats.length + heldCount) / totalSeatsCount) * 100)}%
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {floorBookedSeats.length + heldCount} / {totalSeatsCount} seats
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Active show seat occupancy</p>
          </div>

        </div>

        {/* 2. TAB NAVIGATION & PRIMARY ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-6 gap-3">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('shows')}
              className={`pb-3 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'shows'
                  ? 'border-b-2 border-[#F84464] text-[#F84464]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Showtimes & Pricing</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTab === 'shows' ? 'bg-rose-100 text-[#F84464]' : 'bg-slate-100 text-slate-600'
              }`}>
                {showtimes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('floor_map')}
              className={`pb-3 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'floor_map'
                  ? 'border-b-2 border-[#F84464] text-[#F84464]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Live Seat Layout</span>
            </button>

            <button
              onClick={() => setActiveTab('add_movie')}
              className={`pb-3 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'add_movie'
                  ? 'border-b-2 border-[#F84464] text-[#F84464]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Add Movie</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`pb-3 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'scanner'
                  ? 'border-b-2 border-[#F84464] text-[#F84464]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Ticket Scanner</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddShowModal}
            className="mb-2 sm:mb-2 bg-[#F84464] hover:bg-[#D63A56] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Showtime</span>
          </button>
        </div>

        {/* 3. TAB 1: SHOWTIMES & PRICING TABLE */}
        {activeTab === 'shows' && (
          <div className="space-y-4">
            
            {/* Simple Clean Search Bar (Unwanted hint text removed) */}
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by movie title, time, or screen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-[#F84464] transition-colors"
                />
              </div>
            </div>

            {/* Clean Professional Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
                      <th className="py-3 px-4">Movie</th>
                      <th className="py-3 px-4">Screen</th>
                      <th className="py-3 px-4">Showtime</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-4">Executive Rate</th>
                      <th className="py-3 px-4">Premium Rate</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredShowtimes.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                          No showtimes scheduled. Click "Schedule Showtime" to add shows.
                        </td>
                      </tr>
                    ) : (
                      filteredShowtimes.map((st) => (
                        <tr key={st._id} className="hover:bg-slate-50/70 transition-colors">
                          
                          {/* Movie */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={st.movieId?.image}
                                alt={st.movieId?.title}
                                className="w-10 h-14 object-cover rounded bg-slate-100 shrink-0 border border-slate-200"
                              />
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{st.movieId?.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {st.movieId?.language} &bull; {st.movieId?.genre}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Screen */}
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded text-xs">
                              {st.screen || 'Screen 1'}
                            </span>
                          </td>

                          {/* Showtime */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900 text-sm">{st.time}</p>
                            <p className="text-slate-500 text-[11px]">
                              {new Date(st.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                          </td>

                          {/* Format */}
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[11px]">
                              {st.format || 'Dolby Atmos'}
                            </span>
                          </td>

                          {/* Executive Price */}
                          <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                            ₹{st.priceExecutive}
                          </td>

                          {/* Premium Price */}
                          <td className="py-3 px-4 font-bold text-[#F84464] text-sm">
                            ₹{st.pricePremium}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenPriceModal(st)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:border-[#F84464] hover:text-[#F84464] text-slate-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#F84464]" />
                              <span>Edit Price</span>
                            </button>

                            <button
                              onClick={() => handleDeleteShowtime(st._id)}
                              className="inline-flex items-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

        {/* 4. TAB 2: LIVE SEAT LAYOUT (MATCHING USER BOOKING.JSX EXACTLY) */}
        {activeTab === 'floor_map' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            
            {/* Top Bar: Selector & Live Inventory HUD */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Live Auditorium Seat Map</h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Live Sync
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  100% synchronized with customer booking channels &bull; Live seat holds and bookings
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Inventory HUD Meter */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[11px] text-slate-600 font-medium">
                    Available: <strong className="text-emerald-600 font-bold">{availableCount}</strong> / {totalSeatsCount}
                  </span>
                  <div className="w-24 sm:w-32 h-2 bg-slate-200 rounded-full overflow-hidden flex border border-slate-300">
                    <div style={{ width: `${(availableCount / totalSeatsCount) * 100}%` }} className="bg-emerald-500 h-full" title={`Available: ${availableCount}`}></div>
                    <div style={{ width: `${(heldCount / totalSeatsCount) * 100}%` }} className="bg-amber-400 h-full animate-pulse" title={`Held: ${heldCount}`}></div>
                    <div style={{ width: `${(bookedCount / totalSeatsCount) * 100}%` }} className="bg-slate-600 h-full" title={`Sold: ${bookedCount}`}></div>
                  </div>
                </div>

                {/* Show Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Show:</span>
                  <select
                    value={selectedFloorShowtimeId}
                    onChange={(e) => setSelectedFloorShowtimeId(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white outline-none focus:border-[#F84464] cursor-pointer"
                  >
                    {showtimes.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.movieId?.title} &bull; {s.screen || 'Screen 1'} &bull; {s.time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CURVED NEON SCREEN PROJECTION ARC (Matching User Booking.jsx) */}
            <div className="w-full flex flex-col items-center mb-8 pt-2">
              <div className="relative w-full max-w-2xl flex justify-center">
                <svg className="w-full h-12" viewBox="0 0 500 50" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="partnerScreenGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
                      <stop offset="25%" stopColor="#818cf8" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
                      <stop offset="75%" stopColor="#818cf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 20 42 Q 250 8 480 42"
                    fill="transparent"
                    stroke="url(#partnerScreenGlow)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-1">
                <span>Auditorium Screen This Way</span>
              </div>
            </div>

            {/* Real-Time Legend Strip */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-2.5 border-y border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-green-500 bg-white"></span>
                <span>Available ({availableCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 animate-pulse"></span>
                <span className="font-semibold text-amber-700">Held by Customer ({heldCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-gray-200 border border-gray-300"></span>
                <span>Sold Out ({bookedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-[#F84464] text-white"></span>
                <span className="font-semibold text-[#F84464]">Selected for Inspection</span>
              </div>
            </div>

            {/* SEATING TIERS (Matching Booking.jsx 100%) */}
            <div className="overflow-x-auto py-6 flex flex-col items-center bg-slate-50/70 rounded-xl border border-slate-200">
              
              {/* TIER 1: ROYAL RECLINER LOUNGE */}
              <div className="w-full max-w-4xl mb-3 px-4 sm:px-8 flex items-center justify-between border-b border-rose-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-50 text-amber-600">
                    <Armchair className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Royal Recliner Lounge
                  </span>
                </div>
                <span className="text-xs font-bold text-[#F84464]">₹ {floorPriceRecliner}</span>
              </div>
              <div className="mb-6 space-y-2">
                {reclinerRows.map(row => (
                  <div key={row} className="flex items-center justify-center gap-1.5">
                    <span className="w-6 text-xs font-bold text-slate-400 text-center">{row}</span>
                    <div className="flex gap-1.5">
                      {reclinerCols.map((col, idx) => {
                        if (col === '') return <div key={`r-sp-${idx}`} className="w-6" />;
                        const seatId = `${row}${col}`;
                        const isBooked = floorBookedSeats.includes(seatId);
                        const isHeld = Boolean(floorLockedSeats[seatId]);
                        const isInspected = inspectedSeat?.seatId === seatId;
                        const otherInfo = floorLockedSeats[seatId];

                        let seatClasses = "w-9 h-8 md:w-11 md:h-9 rounded-lg border text-xs transition-all relative font-semibold flex items-center justify-center ";
                        if (isInspected) {
                          seatClasses += "bg-[#F84464] text-white border-[#D63A56] shadow-md scale-105";
                        } else if (isBooked) {
                          seatClasses += "bg-gray-200 border-gray-300 text-gray-400 cursor-pointer";
                        } else if (isHeld) {
                          seatClasses += "bg-amber-100 border-amber-500 text-amber-900 animate-pulse cursor-pointer shadow-sm";
                        } else {
                          seatClasses += "border-green-600/80 text-green-800 bg-white hover:bg-green-500 hover:text-white cursor-pointer active:scale-95";
                        }

                        return (
                          <button
                            key={seatId}
                            onClick={() => {
                              setInspectedSeat({
                                seatId,
                                tier: 'Royal Recliner Lounge',
                                price: floorPriceRecliner,
                                isBooked,
                                isHeld,
                                isInspected: true,
                                holder: otherInfo?.userLabel || 'Customer Session'
                              });
                            }}
                            className={seatClasses}
                            title={`Seat ${seatId} (₹${floorPriceRecliner}): ${isBooked ? 'Sold Out' : isHeld ? 'Held by customer (Click to Inspect/Override)' : 'Available'}`}
                          >
                            <span className="text-[11px] font-bold">{col}</span>
                            {isHeld && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* TIER 2: PRIME CIRCLE */}
              <div className="w-full max-w-4xl mb-3 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Prime Circle
                </span>
                <span className="text-xs font-bold text-slate-900">₹ {floorPricePremium}</span>
              </div>
              <div className="mb-6 space-y-2">
                {primeRows.map(row => (
                  <div key={row} className="flex items-center justify-center gap-1.5">
                    <span className="w-6 text-xs font-bold text-slate-400 text-center">{row}</span>
                    <div className="flex gap-1.5">
                      {cols.map((col, idx) => {
                        if (col === '') return <div key={`p-sp-${idx}`} className="w-4" />;
                        const seatId = `${row}${col}`;
                        const isBooked = floorBookedSeats.includes(seatId);
                        const isHeld = Boolean(floorLockedSeats[seatId]);
                        const isInspected = inspectedSeat?.seatId === seatId;
                        const otherInfo = floorLockedSeats[seatId];

                        let seatClasses = "w-7 h-7 md:w-8 md:h-8 rounded border text-xs transition-all relative font-semibold flex items-center justify-center ";
                        if (isInspected) {
                          seatClasses += "bg-[#F84464] text-white border-[#D63A56] shadow-md scale-105";
                        } else if (isBooked) {
                          seatClasses += "bg-gray-200 border-gray-300 text-gray-400 cursor-pointer";
                        } else if (isHeld) {
                          seatClasses += "bg-amber-100 border-amber-500 text-amber-900 animate-pulse cursor-pointer shadow-sm";
                        } else {
                          seatClasses += "border-green-600/80 text-green-800 bg-white hover:bg-green-500 hover:text-white cursor-pointer active:scale-95";
                        }

                        return (
                          <button
                            key={seatId}
                            onClick={() => {
                              setInspectedSeat({
                                seatId,
                                tier: 'Prime Circle',
                                price: floorPricePremium,
                                isBooked,
                                isHeld,
                                isInspected: true,
                                holder: otherInfo?.userLabel || 'Customer Session'
                              });
                            }}
                            className={seatClasses}
                            title={`Seat ${seatId} (₹${floorPricePremium}): ${isBooked ? 'Sold Out' : isHeld ? 'Held by customer' : 'Available'}`}
                          >
                            <span>{col}</span>
                            {isHeld && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* TIER 3: CLASSIC SECTION */}
              <div className="w-full max-w-4xl mb-3 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Classic Section
                </span>
                <span className="text-xs font-bold text-slate-600">₹ {floorPriceExecutive}</span>
              </div>
              <div className="space-y-2">
                {classicRows.map(row => (
                  <div key={row} className="flex items-center justify-center gap-1.5">
                    <span className="w-6 text-xs font-bold text-slate-400 text-center">{row}</span>
                    <div className="flex gap-1.5">
                      {cols.map((col, idx) => {
                        if (col === '') return <div key={`c-sp-${idx}`} className="w-4" />;
                        const seatId = `${row}${col}`;
                        const isBooked = floorBookedSeats.includes(seatId);
                        const isHeld = Boolean(floorLockedSeats[seatId]);
                        const isInspected = inspectedSeat?.seatId === seatId;
                        const otherInfo = floorLockedSeats[seatId];

                        let seatClasses = "w-7 h-7 md:w-8 md:h-8 rounded border text-xs transition-all relative font-semibold flex items-center justify-center ";
                        if (isInspected) {
                          seatClasses += "bg-[#F84464] text-white border-[#D63A56] shadow-md scale-105";
                        } else if (isBooked) {
                          seatClasses += "bg-gray-200 border-gray-300 text-gray-400 cursor-pointer";
                        } else if (isHeld) {
                          seatClasses += "bg-amber-100 border-amber-500 text-amber-900 animate-pulse cursor-pointer shadow-sm";
                        } else {
                          seatClasses += "border-green-600/80 text-green-800 bg-white hover:bg-green-500 hover:text-white cursor-pointer active:scale-95";
                        }

                        return (
                          <button
                            key={seatId}
                            onClick={() => {
                              setInspectedSeat({
                                seatId,
                                tier: 'Classic Section',
                                price: floorPriceExecutive,
                                isBooked,
                                isHeld,
                                isInspected: true,
                                holder: otherInfo?.userLabel || 'Customer Session'
                              });
                            }}
                            className={seatClasses}
                            title={`Seat ${seatId} (₹${floorPriceExecutive}): ${isBooked ? 'Sold Out' : isHeld ? 'Held by customer' : 'Available'}`}
                          >
                            <span>{col}</span>
                            {isHeld && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Supervisor Seat Inspector Popover */}
            {inspectedSeat && (
              <div className="p-4 rounded-xl border border-slate-300 bg-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm ${
                    inspectedSeat.isInspected ? 'bg-[#F84464] text-white' : inspectedSeat.isBooked ? 'bg-slate-800 text-white' : inspectedSeat.isHeld ? 'bg-amber-400 text-slate-900' : 'bg-emerald-600 text-white'
                  }`}>
                    {inspectedSeat.seatId}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">Seat {inspectedSeat.seatId}</h4>
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                        {inspectedSeat.tier} &bull; ₹{inspectedSeat.price}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {inspectedSeat.isHeld 
                        ? `Held by: ${inspectedSeat.holder} (Checkout in progress)` 
                        : inspectedSeat.isBooked 
                        ? 'Confirmed booking & ticket issued' 
                        : 'Available capacity open for customer booking'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {inspectedSeat.isHeld && (
                    <button
                      onClick={() => handleForceReleaseLock(inspectedSeat.seatId)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Release Hold</span>
                    </button>
                  )}
                  <button
                    onClick={() => setInspectedSeat(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 5. TAB 3: ADD NEW MOVIE */}
        {activeTab === 'add_movie' && (
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs max-w-2xl mx-auto">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-900">Add Movie to Theater Listing</h3>
              <p className="text-xs text-slate-500 mt-1">
                Add a new movie title to your theater catalog for showtime scheduling.
              </p>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Movie Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pushpa 2: The Rule"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-[#F84464]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Language *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telugu, Hindi"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-[#F84464]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Genre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Action / Thriller"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Poster Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  value={movieForm.image}
                  onChange={(e) => setMovieForm({ ...movieForm, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-[#F84464]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Audience Rating (out of 10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={movieForm.rating}
                    onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-[#F84464]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    YouTube Trailer URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/embed/..."
                    value={movieForm.trailerUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={movieSubmitting}
                className="w-full bg-[#F84464] hover:bg-[#D63A56] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer mt-4"
              >
                {movieSubmitting ? 'Publishing Movie...' : 'Publish Movie to Catalog'}
              </button>
            </form>
          </div>
        )}

        {/* 6. TAB 4: TICKET SCANNER */}
        {activeTab === 'scanner' && (
          <div>
            <TicketGateScanner userRole="partner" currentTheater={theater} />
          </div>
        )}

      </main>

      {/* 7. MODAL: EDIT TICKET PRICE */}
      {editingShowtime && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Update Ticket Prices</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingShowtime.movieId?.title} &bull; {editingShowtime.screen || 'Screen 1'} &bull; {editingShowtime.time}
                </p>
              </div>
              <button 
                onClick={() => setEditingShowtime(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Executive Ticket Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="2000"
                  value={priceForm.priceExecutive}
                  onChange={(e) => setPriceForm({ ...priceForm, priceExecutive: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-[#F84464]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premium Ticket Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="3000"
                  value={priceForm.pricePremium}
                  onChange={(e) => setPriceForm({ ...priceForm, pricePremium: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-[#F84464] outline-none focus:border-[#F84464]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingShowtime(null)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={priceUpdating}
                  className="flex-1 py-2.5 bg-[#F84464] hover:bg-[#D63A56] text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {priceUpdating ? 'Saving...' : 'Save Prices'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 8. MODAL: SCHEDULE NEW SHOWTIME */}
      {isAddShowModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">Schedule Showtimes</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isSingleScreen
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {isSingleScreen ? 'Single-Screen Cinema' : 'Multiplex Cinema'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{theater?.name}</p>
              </div>
              <button 
                onClick={() => setIsAddShowModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateShowtime} className="space-y-4 overflow-y-auto pr-1">
              
              {/* Theater Architecture Constraint Info Card */}
              {isSingleScreen ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                  <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Single-Screen Cinema Policy</span>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      At any given time, only <strong>ONE</strong> movie can run across the entire theater. Conflicting showtimes with other movies at the same time slot are prevented.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
                  <Tv className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Multiplex Screen Policy ({showForm.screen})</span>
                    <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                      On <strong>{showForm.screen}</strong>, only <strong>ONE</strong> movie can run at each time slot. Other screens in your theater can screen different movies simultaneously.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Select Movie */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Movie *
                </label>
                <select
                  required
                  value={showForm.movieId || (moviesList.length > 0 ? moviesList[0]._id : '')}
                  onChange={(e) => {
                    setShowForm({ ...showForm, movieId: e.target.value });
                    setScheduleError('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-[#F84464] bg-white cursor-pointer"
                >
                  {moviesList.length === 0 ? (
                    <option value="">No movies available in theater catalog</option>
                  ) : (
                    moviesList.map(m => (
                      <option key={m._id} value={m._id}>{m.title} ({m.language})</option>
                    ))
                  )}
                </select>
              </div>

              {/* 2. Screen & Projection Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Screen {isSingleScreen ? '(Single Auditorium)' : '*'}
                  </label>
                  <select
                    disabled={isSingleScreen}
                    value={showForm.screen}
                    onChange={(e) => handleScreenSelect(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs outline-none font-medium ${
                      isSingleScreen
                        ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:border-[#F84464] text-slate-900 cursor-pointer'
                    }`}
                  >
                    {theaterScreens.map((s, idx) => (
                      <option key={s.screenNumber || idx} value={s.name}>
                        {s.name} ({s.screenType || 'Standard'} &bull; {s.capacity || 200} seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Projection Format
                  </label>
                  <select
                    value={showForm.format}
                    onChange={(e) => setShowForm({ ...showForm, format: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#F84464] bg-white cursor-pointer font-medium text-slate-900"
                  >
                    {[...new Set([showForm.format, ...theaterScreens.map(s => s.screenType), ...PROJECTION_FORMATS].filter(Boolean))].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Duration: Start Date & Number of Days */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={showForm.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setShowForm({ ...showForm, startDate: e.target.value });
                        setScheduleError('');
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-[#F84464]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duration in Days (1 to 30) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        required
                        value={showForm.days}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(30, parseInt(e.target.value) || 1));
                          setShowForm({ ...showForm, days: val });
                          setScheduleError('');
                        }}
                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#F84464] text-center"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {[1, 3, 7, 14].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              setShowForm(prev => ({ ...prev, days: num }));
                              setScheduleError('');
                            }}
                            className={`px-2 py-1.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                              Number(showForm.days) === num
                                ? 'bg-[#1F2533] text-white border-[#1F2533]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {num === 1 ? '1D' : num === 3 ? '3D' : num === 7 ? '1W' : '2W'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Computed Date Range HUD */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Runs from <strong>{computeStartDateFormatted(showForm.startDate)}</strong> to <strong>{computeEndDate(showForm.startDate, showForm.days)}</strong>
                    </span>
                  </div>
                  <span className="font-bold text-[#F84464] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {showForm.days} {Number(showForm.days) === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              </div>

              {/* 4. Daily Showtimes */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Daily Showtime Slots *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(prev => ({
                          ...prev,
                          times: ['11:00 AM', '02:30 PM', '06:30 PM', '09:45 PM']
                        }));
                        setScheduleError('');
                      }}
                      className="text-[11px] text-[#F84464] hover:underline font-semibold cursor-pointer"
                    >
                      Select Standard 4
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(prev => ({ ...prev, times: [] }));
                        setScheduleError('');
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Quick Toggle Slot Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Morning', time: '11:00 AM' },
                    { label: 'Matinee', time: '02:30 PM' },
                    { label: 'First Show', time: '06:30 PM' },
                    { label: 'Second Show', time: '09:45 PM' }
                  ].map(slot => {
                    const isSelected = showForm.times.includes(slot.time);
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => {
                          setShowForm(prev => {
                            const exists = prev.times.includes(slot.time);
                            return {
                              ...prev,
                              times: exists ? prev.times.filter(t => t !== slot.time) : [...prev.times, slot.time].sort()
                            };
                          });
                          setScheduleError('');
                        }}
                        className={`p-2 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1F2533] text-white border-[#1F2533] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <span className="text-[10px] opacity-75">{slot.label}</span>
                        <span className="font-bold text-xs">{slot.time}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Times Display and Custom Adder */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[30px]">
                    {showForm.times.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No showtimes selected. Pick presets above or enter a custom time.</span>
                    ) : (
                      showForm.times.map(t => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-800 shadow-2xs"
                        >
                          <Clock className="w-3 h-3 text-[#F84464]" />
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForm(prev => ({
                                ...prev,
                                times: prev.times.filter(item => item !== t)
                              }));
                              setScheduleError('');
                            }}
                            className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Custom Slot Adder */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Custom time, e.g. 04:15 PM"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs outline-none focus:border-[#F84464]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!customTime.trim()) return;
                        const formatted = customTime.trim();
                        if (!showForm.times.includes(formatted)) {
                          setShowForm(prev => ({ ...prev, times: [...prev.times, formatted] }));
                        }
                        setCustomTime('');
                        setScheduleError('');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold cursor-pointer shrink-0"
                    >
                      + Add Time
                    </button>
                  </div>
                </div>

                {/* Total Showtimes Scheduled Calculation */}
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <div>
                    <span className="font-bold">Total Shows Scheduled:</span>{' '}
                    <span>{showForm.days} days &times; {showForm.times.length} daily showtimes</span>
                  </div>
                  <span className="font-black text-xs px-2.5 py-0.5 bg-emerald-600 text-white rounded">
                    {showForm.days * showForm.times.length} Shows
                  </span>
                </div>
              </div>

              {/* 5. Pricing */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Executive (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="2000"
                    value={showForm.priceExecutive}
                    onChange={(e) => setShowForm({ ...showForm, priceExecutive: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:border-[#F84464]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Premium (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="3000"
                    value={showForm.pricePremium}
                    onChange={(e) => setShowForm({ ...showForm, pricePremium: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-[#F84464] outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>

              {/* Live Conflict Alert Banner */}
              {currentConflicts.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Scheduling Conflict Detected ({currentConflicts.length} slot{currentConflicts.length > 1 ? 's' : ''})</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    {isSingleScreen
                      ? 'In a single-screen theater, only one movie can play at a time. The following slots already have shows scheduled:'
                      : `Screen "${showForm.screen}" already has shows scheduled during these slots:`}
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {currentConflicts.slice(0, 5).map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/90 px-2 py-1 rounded border border-amber-200 text-[11px] text-amber-900 font-medium">
                        <span>{c.dateStr} &bull; {c.time}</span>
                        <span className="font-semibold text-rose-700 truncate max-w-[200px]">Playing: {c.existingMovie}</span>
                      </div>
                    ))}
                    {currentConflicts.length > 5 && (
                      <p className="text-[10px] text-amber-700 italic">...and {currentConflicts.length - 5} more conflict(s)</p>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-700 pt-0.5 font-medium">
                    Please adjust your dates, remove conflicting times, or select an available screen.
                  </p>
                </div>
              )}

              {/* Backend Error Message Banner */}
              {scheduleError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs flex items-start gap-2 text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Cannot Schedule Showtimes</p>
                    <p className="text-[11px] leading-relaxed text-rose-800">{scheduleError}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddShowModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={currentConflicts.length > 0 || scheduleSubmitting || showForm.times.length === 0}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer ${
                    currentConflicts.length > 0
                      ? 'bg-amber-600 text-white cursor-not-allowed opacity-90'
                      : scheduleSubmitting || showForm.times.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-[#F84464] hover:bg-[#D63A56] text-white active:scale-98'
                  }`}
                >
                  {scheduleSubmitting ? (
                    'Scheduling Shows...'
                  ) : currentConflicts.length > 0 ? (
                    `Resolve ${currentConflicts.length} Conflict(s)`
                  ) : (
                    `Schedule ${showForm.days * showForm.times.length} Showtime(s)`
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PartnerDashboard;
