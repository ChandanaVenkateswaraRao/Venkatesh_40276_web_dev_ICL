import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';
import { 
  Ticket, 
  Printer, 
  CheckCircle, 
  User, 
  Settings, 
  CreditCard, 
  Gift, 
  HelpCircle, 
  LogOut, 
  Calendar, 
  MapPin, 
  Clock, 
  Armchair, 
  QrCode, 
  Edit3, 
  Check, 
  AlertCircle,
  Film,
  Search,
  ChevronRight,
  Wallet
} from 'lucide-react';
import TicketPassModal from '../components/TicketPassModal';
import { useLocationContext } from '../context/LocationContext';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPassBooking, setSelectedPassBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings | settings | vouchers | help
  
  // Settings form state
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Booking search/filter
  const [bookingSearch, setBookingSearch] = useState('');

  // Saved gift cards from localStorage
  const [savedCards, setSavedCards] = useState([]);

  const { city, setCity } = useLocationContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
        if (res.data.user) {
          setNameInput(res.data.user.name || '');
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Load gift cards from localStorage
    try {
      const cards = JSON.parse(localStorage.getItem('bms_gift_cards') || '[]');
      setSavedCards(cards);
    } catch (e) {
      setSavedCards([]);
    }
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess('');
    setSettingsError('');

    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        { name: nameInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = res.data.user || { ...profile.user, name: nameInput };
      setProfile(prev => ({ ...prev, user: updatedUser }));
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSettingsSuccess('Profile updated successfully!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      setSettingsError(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F84464]"></div>
        <p className="text-xs text-gray-400 font-semibold">Loading profile & bookings...</p>
      </div>
    );
  }

  if (!profile || !profile.user) {
    return null;
  }

  const bookingsList = profile.bookings || [];
  const filteredBookings = bookingsList.filter(b => {
    if (!bookingSearch.trim()) return true;
    const title = b.movie?.title || '';
    return title.toLowerCase().includes(bookingSearch.toLowerCase()) || b._id.includes(bookingSearch);
  });

  const totalSpent = bookingsList.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <div className="bg-[#F5F5F7] min-h-screen py-10 text-gray-800">
      <div className="max-w-5xl mx-auto px-4">
        {/* User Info Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#F84464] to-[#ff6b84] text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shadow-pink-500/20 flex-shrink-0">
              {profile.user.name ? profile.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">{profile.user.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified Member
                </span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{profile.user.email}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#F84464]" /> {city || 'Bengaluru'}
                </span>
                <span>•</span>
                <span>Role: <strong className="text-gray-600 capitalize">{profile.user.role || 'User'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Movie Bookings
            </span>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{bookingsList.length}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Tickets Purchased
            </span>
            <p className="text-2xl sm:text-3xl font-black text-[#F84464]">
              {bookingsList.reduce((sum, b) => sum + (b.seats?.length || 0), 0)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Spend Value
            </span>
            <p className="text-2xl sm:text-3xl font-black text-green-600">₹{totalSpent.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-tr from-slate-900 to-[#1F2533] text-white p-5 rounded-2xl border border-slate-700 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                  BMS Wallet
                </span>
                <Wallet className="w-3.5 h-3.5 text-[#F84464]" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                ₹{(user?.walletBalance || 0).toLocaleString()}
              </p>
            </div>
            <Link 
              to="/gift-cards" 
              className="text-[11px] text-pink-400 hover:text-pink-300 font-bold mt-2 inline-flex items-center gap-1"
            >
              + Redeem / Add Money
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'bookings', label: 'My Movie Tickets', count: bookingsList.length, icon: Ticket },
            { id: 'settings', label: 'Profile Settings', icon: Settings },
            { id: 'vouchers', label: 'Saved Gift Cards', count: savedCards.length, icon: Gift },
            { id: 'help', label: 'Support & Help', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'border-[#F84464] text-[#F84464]' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-red-50 text-[#F84464]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Bookings */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#F84464]" /> 
                Your Booking History ({filteredBookings.length})
              </h2>

              {bookingsList.length > 0 && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search movie or booking ID..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full text-xs outline-none bg-transparent"
                  />
                  {bookingSearch && (
                    <button onClick={() => setBookingSearch('')} className="text-[10px] text-gray-400">
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#F84464]">
                  <Film className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {bookingSearch ? 'No matching bookings found' : 'No Tickets Booked Yet'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  {bookingSearch 
                    ? `No tickets matched "${bookingSearch}". Try clearing your search.`
                    : 'Looks like you haven\'t booked any movie tickets yet. Explore movies showing in your city!'}
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-[#F84464] hover:bg-[#d63a56] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/20"
                >
                  Explore Now Showing
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {filteredBookings.map((booking) => (
                  <div 
                    key={booking._id} 
                    className="bg-white rounded-3xl shadow-xs border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow"
                  >
                    {/* Movie Poster */}
                    <div className="w-full md:w-48 h-52 md:h-auto bg-gray-100 flex-shrink-0 relative overflow-hidden">
                      <img 
                        src={booking.movie?.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600'} 
                        alt={booking.movie?.title || 'Movie'} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {booking.seats?.length} {booking.seats?.length === 1 ? 'Ticket' : 'Tickets'}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                            <h3 className="text-xl font-black text-gray-900 leading-tight">
                              {booking.movie?.title || 'Confirmed Movie Experience'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {booking.movie?.language || 'Hindi / English'} • 2D • Audi 02
                            </p>
                          </div>

                          <button
                            onClick={() => setSelectedPassBooking(booking)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#F84464] bg-pink-50 hover:bg-pink-100 border border-pink-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Official E-Ticket</span>
                          </button>
                        </div>

                        <p className="text-gray-400 text-[11px] mb-4">
                          Booked on: {new Date(booking.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Seat Numbers</span>
                            <span className="font-bold text-gray-900 flex items-center gap-1 mt-0.5">
                              <Armchair className="w-3.5 h-3.5 text-[#F84464]" />
                              {booking.seats?.join(', ')}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Total Amount</span>
                            <span className="font-extrabold text-green-600 mt-0.5 block">
                              ₹{booking.totalAmount}
                            </span>
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Status</span>
                            <span className="font-bold text-green-700 flex items-center gap-1 mt-0.5">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Confirmed
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>Booking ID: <strong className="font-mono text-gray-700">{booking._id}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Validation Stub */}
                    <div className="p-6 bg-gray-50/80 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col items-center justify-center min-w-[190px]">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=TICKET:${booking._id}`} 
                        alt="QR Code" 
                        className="w-24 h-24 border-2 border-white shadow-xs rounded-xl bg-white mb-2" 
                      />
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">
                        Gate QR Code
                      </p>
                      <button
                        onClick={() => setSelectedPassBooking(booking)}
                        className="text-xs text-[#F84464] hover:underline mt-2 font-bold cursor-pointer"
                      >
                        Open Full Ticket &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Settings & Profile Update */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#F84464]" /> Personal Information
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Update your profile display name and personal preferences.
            </p>

            {settingsSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-xs text-green-800 font-bold animate-fade-in">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                {settingsSuccess}
              </div>
            )}

            {settingsError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-600 font-bold animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                {settingsError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input 
                  type="text" 
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#F84464] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Registered Email Address (Read-only)
                </label>
                <input 
                  type="email" 
                  disabled
                  value={profile.user.email}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400 mt-1">To change email, contact security support.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Default City
                </label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#F84464] focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="bg-[#F84464] hover:bg-[#d63a56] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-pink-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {savingSettings ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: Saved Gift Cards */}
        {activeTab === 'vouchers' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#F84464]" /> 
                Your E-Gift Vouchers ({savedCards.length})
              </h2>

              <Link
                to="/gift-cards"
                className="bg-[#F84464] text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-[#d63a56] transition-colors"
              >
                + Buy New Gift Card
              </Link>
            </div>

            {savedCards.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-200">
                <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#F84464]">
                  <Gift className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">No Gift Cards Saved Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  Purchased e-gift cards will automatically appear here with their 16-digit card number and security PIN.
                </p>
                <Link
                  to="/gift-cards"
                  className="bg-[#1A1C2A] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800"
                >
                  Explore Gift Cards
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedCards.map((card, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#F84464] bg-red-50 px-2.5 py-0.5 rounded-full">
                          {card.theme?.name || 'All-Access Card'}
                        </span>
                        <span className="text-xl font-black text-gray-900">₹{card.amount}</span>
                      </div>

                      <div className="mb-4">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-0.5">Card Number</span>
                        <p className="font-mono text-base font-bold text-gray-800 tracking-wider">
                          {card.cardNumber}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <span>PIN: <strong className="font-mono text-gray-800">{card.pin}</strong></span>
                        <span>Recipient: <strong>{card.recipientName}</strong></span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                      <span>Valid till: {card.validTill}</span>
                      <span className="text-green-600 font-bold">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Support & Help */}
        {activeTab === 'help' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#F84464]" /> Customer Support & Booking Assistance
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Need help with ticket cancellation, M-Ticket entry, or refund status?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-sm text-gray-800 mb-1">Ticket Cancellation Policy</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  Tickets can be cancelled up to 2 hours prior to showtime for participating cinemas marked with "Cancellable". Refund is processed back to the original payment source within 3-5 business days.
                </p>
                <span className="text-xs font-bold text-[#F84464]">75% refund value on eligible bookings</span>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <h3 className="font-bold text-sm text-gray-800 mb-1">Show Entry with E-Ticket</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  You do not need a physical printout at the cinema! Simply display the QR Code on your mobile screen at the cinema turnstile for instant contactless entry.
                </p>
                <span className="text-xs font-bold text-green-600">Eco-Friendly & Instant</span>
              </div>
            </div>
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
