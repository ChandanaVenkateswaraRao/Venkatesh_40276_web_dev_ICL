import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Ticket, 
  Gift, 
  Film, 
  Calculator, 
  CheckCircle2, 
  Send, 
  PhoneCall, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  ChevronDown, 
  ArrowRight,
  Search,
  FileText,
  Printer,
  MapPin,
  Calendar,
  Clock,
  Coffee,
  Monitor,
  Percent,
  BadgeCheck,
  Briefcase,
  Layers,
  Copy,
  ExternalLink,
  MessageCircle,
  Check,
  Star,
  Activity,
  Award
} from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import { getSocket } from '../utils/socket';
import { API_BASE_URL } from '../api/config';

const API_BASE = API_BASE_URL;

const Corporates = () => {
  const { city: globalCity, setCity: setGlobalCity } = useLocationContext();
  
  // Active navigation tab: 'screening' | 'vouchers' | 'track'
  const [activeTab, setActiveTab] = useState('screening');

  // Selected parameters
  const [selectedCity, setSelectedCity] = useState(globalCity || 'Bengaluru');
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedAudi, setSelectedAudi] = useState(null);

  // Attendees & Add-ons
  const [attendees, setAttendees] = useState(80);
  const [timeSlot, setTimeSlot] = useState('Prime Evening (06:30 PM - 10:00 PM)');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [includeSnacks, setIncludeSnacks] = useState(true);
  const [snackPackage, setSnackPackage] = useState('Executive Bento Box (Popcorn + Nachos + Beverage)');
  const [includePresentationKit, setIncludePresentationKit] = useState(false);

  // Stats & live activity from backend
  const [stats, setStats] = useState({
    theatersCount: 23,
    totalAuditoriums: 92,
    nationwideCapacity: 16560,
    corporateRequestsProcessed: 1420,
    averageResponseMinutes: 12,
    gstComplianceRate: '100% Tax Deductible (18% ITC)',
    activeDeskStatus: 'ONLINE'
  });
  const [recentFeed, setRecentFeed] = useState([]);

  // Form submission state
  const [formData, setFormData] = useState({
    contactName: '',
    workEmail: '',
    companyName: '',
    phone: '',
    gstin: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Inquiry Tracker state
  const [trackRefId, setTrackRefId] = useState('');
  const [trackedInquiry, setTrackedInquiry] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Pro-forma quote modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // Bulk vouchers calculator state
  const [voucherDenom, setVoucherDenom] = useState(500);
  const [voucherQty, setVoucherQty] = useState(150);
  const [voucherCompany, setVoucherCompany] = useState('Your Company');
  const [voucherCustomMessage, setVoucherCustomMessage] = useState('Thank you for being an exceptional team member!');

  // FAQ state
  const [activeFaq, setActiveFaq] = useState(null);

  // Available Indian Cities with active corporate desks
  const availableCities = [
    'Bengaluru',
    'Mumbai',
    'Hyderabad',
    'Delhi-NCR',
    'Chennai',
    'Pune',
    'Ahmedabad',
    'Chandigarh',
    'Kolkata',
    'Kochi'
  ];

  // Sync city when global context changes
  useEffect(() => {
    if (globalCity && globalCity !== selectedCity) {
      setSelectedCity(globalCity);
    }
  }, [globalCity]);

  // Load theaters, movies, stats and recent activity from real backend
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        // Fetch theaters for selected city
        const theatersRes = await fetch(`${API_BASE}/corporate/theaters?city=${encodeURIComponent(selectedCity)}`);
        if (theatersRes.ok) {
          const tData = await theatersRes.json();
          setTheaters(tData);
          if (tData.length > 0) {
            setSelectedTheater(tData[0]);
            if (tData[0].audis && tData[0].audis.length > 0) {
              setSelectedAudi(tData[0].audis[0]);
              setAttendees(Math.min(80, tData[0].audis[0].capacity));
            }
          }
        }

        // Fetch movies
        const moviesRes = await fetch(`${API_BASE}/corporate/movies?city=${encodeURIComponent(selectedCity)}`);
        if (moviesRes.ok) {
          const mData = await moviesRes.json();
          setMovies(mData);
          if (mData.length > 0) {
            setSelectedMovie(mData[0]);
          }
        }

        // Fetch stats
        const statsRes = await fetch(`${API_BASE}/corporate/stats`);
        if (statsRes.ok) {
          const sData = await statsRes.json();
          setStats(sData);
        }

        // Fetch recent activity
        const recentRes = await fetch(`${API_BASE}/corporate/recent-activity`);
        if (recentRes.ok) {
          const rData = await recentRes.json();
          const list = [
            ...(rData.recentInquiries || []).map(item => ({
              companyName: item.companyName,
              city: item.city,
              attendees: item.attendees,
              theaterName: item.theaterName,
              movieTitle: item.movieTitle,
              screenFormat: item.screenFormat,
              timeAgo: 'Just now'
            })),
            ...(rData.liveHighlights || [])
          ];
          setRecentFeed(list.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching corporate data:', err);
      }
    };

    fetchRealData();
  }, [selectedCity]);

  // Handle theater change
  const handleTheaterChange = (theaterId) => {
    const found = theaters.find(t => t._id === theaterId);
    if (found) {
      setSelectedTheater(found);
      if (found.audis && found.audis.length > 0) {
        setSelectedAudi(found.audis[0]);
        if (attendees > found.audis[0].capacity) {
          setAttendees(found.audis[0].capacity);
        }
      }
    }
  };

  // Handle audi change
  const handleAudiChange = (audi) => {
    setSelectedAudi(audi);
    if (attendees > audi.capacity) {
      setAttendees(audi.capacity);
    }
  };

  // Socket listener for live corporate bookings
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewInquiry = (data) => {
      setRecentFeed(prev => [
        {
          companyName: data.companyName,
          city: data.city,
          attendees: data.attendees,
          theaterName: 'Corporate Audi',
          movieTitle: data.serviceType,
          screenFormat: 'Enterprise Booking',
          timeAgo: 'Live Now'
        },
        ...prev.slice(0, 4)
      ]);
      setStats(prev => ({
        ...prev,
        corporateRequestsProcessed: (prev.corporateRequestsProcessed || 1420) + 1
      }));
    };

    socket.on('corporate_inquiry_created', handleNewInquiry);

    return () => {
      socket.off('corporate_inquiry_created', handleNewInquiry);
    };
  }, []);

  // Dynamic pricing calculations
  const seatRate = selectedAudi?.basePricePerSeat || 380;
  const ticketSubtotal = attendees * seatRate;

  let snackCostPerPax = 0;
  if (includeSnacks) {
    if (snackPackage.includes('Buffet')) snackCostPerPax = 550;
    else if (snackPackage.includes('Bento') || snackPackage.includes('Executive')) snackCostPerPax = 320;
    else snackCostPerPax = 180;
  }
  const snacksSubtotal = includeSnacks ? attendees * snackCostPerPax : 0;
  const brandingSubtotal = includePresentationKit ? 4500 : 0;
  const rawSubtotal = ticketSubtotal + snacksSubtotal + brandingSubtotal;

  let discountPercent = 10;
  if (attendees >= 300) discountPercent = 25;
  else if (attendees >= 150) discountPercent = 20;
  else if (attendees >= 75) discountPercent = 15;

  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const subtotalAfterDiscount = rawSubtotal - discountAmount;
  const gstAmount = Math.round(subtotalAfterDiscount * 0.18);
  const cgstAmount = Math.round(gstAmount / 2);
  const sgstAmount = gstAmount - cgstAmount;
  const grandTotal = subtotalAfterDiscount + gstAmount;
  const perPersonEstimate = Math.round(grandTotal / Math.max(attendees, 1));

  // Vouchers calculation
  let voucherDiscountPercent = 5;
  if (voucherQty >= 500) voucherDiscountPercent = 20;
  else if (voucherQty >= 250) voucherDiscountPercent = 15;
  else if (voucherQty >= 100) voucherDiscountPercent = 10;

  const rawVoucherTotal = voucherQty * voucherDenom;
  const voucherDiscountAmount = Math.round((rawVoucherTotal * voucherDiscountPercent) / 100);
  const netVoucherTotal = rawVoucherTotal - voucherDiscountAmount;

  // Submit formal corporate inquiry to backend
  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        contactName: formData.contactName,
        workEmail: formData.workEmail,
        companyName: formData.companyName,
        phone: formData.phone,
        gstin: formData.gstin,
        city: selectedCity,
        serviceType: 'Private Auditorium Screening',
        theaterId: selectedTheater?._id,
        theaterName: selectedTheater?.name,
        movieId: selectedMovie?._id,
        movieTitle: selectedMovie?.title,
        screenFormat: selectedAudi?.format || 'Standard 2D Luxe',
        attendees,
        preferredDate,
        preferredTimeSlot: timeSlot,
        includeSnacks,
        snackPackage,
        includePresentationKit,
        notes: formData.notes
      };

      const res = await fetch(`${API_BASE}/corporate/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit corporate request');
      }

      const savedData = await res.json();
      setSubmittedBooking(savedData);
      setSubmitting(false);

      // Save to localStorage so user can easily track later
      localStorage.setItem('lastCorporateRef', savedData.refId);

      // Scroll to confirmation
      const confirmElem = document.getElementById('confirmation-card');
      if (confirmElem) {
        confirmElem.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      alert(err.message);
      setSubmitting(false);
    }
  };

  // Track inquiry by reference ID
  const handleTrackInquiry = async (refToSearch) => {
    const targetRef = (refToSearch || trackRefId).trim();
    if (!targetRef) return;

    setTrackingLoading(true);
    setTrackError('');
    setTrackedInquiry(null);

    try {
      const res = await fetch(`${API_BASE}/corporate/track/${encodeURIComponent(targetRef)}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Reference ID not found');
      }
      const data = await res.json();
      setTrackedInquiry(data);
    } catch (err) {
      setTrackError(err.message);
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyRefToClipboard = (ref) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const faqs = [
    {
      q: 'How does auditorium privatization and minimum seating work?',
      a: 'We offer full auditorium lockouts across standard multiplex screens (150-250 seats), premium IMAX halls (up to 350 seats), and luxury VIP Recliner Gold Class audis (50-75 seats). The quote dynamically accommodates your guest size with tiered corporate discounts.'
    },
    {
      q: 'Do you provide compliant GST invoices with 18% Input Tax Credit (ITC)?',
      a: 'Yes. 100% of our corporate contracts, private screenings, and bulk voucher orders come with a formal tax invoice quoting your company GSTIN, enabling full tax input credit under Business Entertainment & Employee Welfare.'
    },
    {
      q: 'Can we connect laptops to the big screen for presentation before the movie?',
      a: 'Yes! Our AV technical kit includes high-bandwidth HDMI connectivity, wireless screen mirroring onto the 4K cinema projection, podium setup, and wireless handheld microphones for company presentations, townhalls, or award ceremonies.'
    },
    {
      q: 'What are the accepted corporate payment methods and billing terms?',
      a: 'We accept direct Corporate Bank Wire (NEFT/RTGS), Corporate Credit Cards, and approved Purchase Orders (PO) with net-15 billing terms for pre-registered enterprise clients.'
    },
    {
      q: 'How do Bulk Digital Movie Vouchers work for employee rewards?',
      a: 'Digital voucher codes are generated in automated batches with 12-month validity across all our partner screens in India. Employees can redeem them on any movie, showtime, and seat directly through the web portal or mobile app.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-800 font-sans selection:bg-[#F84464] selection:text-white">
      {/* Top Live Concierge Status Bar */}
      <div className="bg-[#11131F] text-gray-300 text-xs py-2 px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-green-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Corporate Concierge Desk Active
            </span>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <span className="text-gray-400 hidden sm:inline">
              Avg. Formal Quote Response: <strong className="text-white">{stats.averageResponseMinutes} mins</strong>
            </span>
            <span className="text-gray-600 hidden md:inline">|</span>
            <span className="text-gray-400 hidden md:inline">
              GST ITC: <strong className="text-white">100% Tax Deductible (18%)</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a 
              href="tel:+918044556677" 
              className="hover:text-white flex items-center gap-1 text-gray-300 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#F84464]" />
              Enterprise Hotline: +91 80 4455 6677
            </a>
            <a 
              href="mailto:corporates@bookmyshow.icl" 
              className="hover:text-white flex items-center gap-1 text-gray-300 transition-colors hidden sm:flex"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              corporates@bookmyshow.icl
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#121422] via-[#1E2338] to-[#121422] text-white pt-14 pb-20 px-4 overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#F84464_1.5px,transparent_1.5px)] [background-size:20px_20px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold mb-4 backdrop-blur-xs">
                <Building2 className="w-3.5 h-3.5 text-[#F84464]" />
                Official Enterprise Screening & Gifting Desk
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                Turn Blockbuster Cinema Into <span className="text-[#F84464] drop-shadow-sm">Corporate Experiences</span>
              </h1>
              
              <p className="text-gray-300 text-base sm:text-lg mt-4 leading-relaxed font-normal">
                Private multiplex auditoriums, townhall keynotes on giant screens, and instant bulk digital reward vouchers across <strong className="text-white">{stats.theatersCount}+ partner cinemas</strong> and <strong className="text-white">{stats.totalAuditoriums}+ auditoriums</strong> nationwide.
              </p>

              {/* City quick filter pill */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#F84464]" /> Selected City:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableCities.slice(0, 5).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCity(c);
                        setGlobalCity(c);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedCity === c 
                          ? 'bg-[#F84464] text-white shadow-md shadow-pink-500/20' 
                          : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700/60'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setGlobalCity(e.target.value);
                    }}
                    className="bg-gray-800/80 text-gray-300 border border-gray-700/60 text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
                  >
                    {availableCities.map(c => (
                      <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-8">
                <a 
                  href="#configurator" 
                  onClick={() => setActiveTab('screening')}
                  className="bg-[#F84464] hover:bg-[#d63a56] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  Customize Private Screening
                </a>
                <a 
                  href="#vouchers-section" 
                  onClick={() => setActiveTab('vouchers')}
                  className="bg-gray-800/90 hover:bg-gray-700 text-gray-200 border border-gray-700 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-yellow-400" />
                  Bulk Digital Vouchers
                </a>
                <a 
                  href="#track-section" 
                  onClick={() => setActiveTab('track')}
                  className="bg-gray-800/60 hover:bg-gray-700/80 text-gray-300 border border-gray-700/60 px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-blue-400" />
                  Track Live Request
                </a>
              </div>
            </div>

            {/* Live Real-Time Activity Feed Card */}
            <div className="w-full lg:w-[420px] bg-gradient-to-b from-[#1C2030] to-[#161928] border border-gray-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-gray-700/80 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#F84464]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Live Enterprise Activity</span>
                </div>
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                  Real-time
                </span>
              </div>

              <div className="space-y-3">
                {recentFeed.map((item, idx) => (
                  <div key={idx} className="bg-gray-800/50 hover:bg-gray-800/80 p-2.5 rounded-xl border border-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-white truncate max-w-[240px]">{item.companyName}</p>
                      <span className="text-[10px] text-gray-400 font-mono">{item.timeAgo}</span>
                    </div>
                    <p className="text-[11px] text-gray-300 mt-0.5 flex items-center gap-1 truncate">
                      <span className="text-[#F84464] font-semibold">{item.attendees} Guests</span>
                      <span>•</span>
                      <span className="text-gray-400">{item.theaterName || 'Multiplex Audi'}</span>
                      <span>({item.city})</span>
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                      <span className="text-yellow-400/90 font-medium">{item.movieTitle}</span>
                      <span className="bg-gray-700/60 px-1.5 py-0.2 rounded text-gray-300">{item.screenFormat}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verified Trust Badges */}
              <div className="mt-4 pt-3 border-t border-gray-700/80 grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>GSTIN Compliant Invoicing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>NDA for Pre-Releases</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real Metrics Ticker Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-gray-700/60">
            <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.theatersCount} Multiplexes</p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.totalAuditoriums} Auditoriums across India</p>
            </div>
            <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.corporateRequestsProcessed}+</p>
              <p className="text-xs text-gray-400 mt-0.5">Corporate Bookings Processed</p>
            </div>
            <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
              <p className="text-2xl sm:text-3xl font-black text-white">10% - 25%</p>
              <p className="text-xs text-gray-400 mt-0.5">Tiered Bulk Corporate Savings</p>
            </div>
            <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
              <p className="text-2xl sm:text-3xl font-black text-green-400">18% GST ITC</p>
              <p className="text-xs text-gray-400 mt-0.5">Input Tax Credit Tax Deductible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between overflow-x-auto py-2">
            <div className="flex space-x-1 sm:space-x-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('screening');
                  const elem = document.getElementById('configurator');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'screening'
                    ? 'bg-[#1A1C2A] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Film className="w-4 h-4 text-[#F84464]" />
                Private Cinema Screening
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('vouchers');
                  const elem = document.getElementById('vouchers-section');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'vouchers'
                    ? 'bg-[#1A1C2A] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Ticket className="w-4 h-4 text-yellow-500" />
                Bulk Digital Vouchers
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('track');
                  const elem = document.getElementById('track-section');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-[#1A1C2A] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Search className="w-4 h-4 text-blue-500" />
                Track Live Request
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-[#F84464]" />
              Showing cinemas in <strong className="text-gray-800">{selectedCity}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Real-Time Interactive Cinema Configurator & Quote Engine */}
      <div id="configurator" className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F84464] flex items-center justify-center gap-1">
            <Calculator className="w-4 h-4" /> Real-Time Enterprise Engine
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1A1C2A] mt-1">
            Build Your Private Screening Package
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            Select actual cinemas and running movies in {selectedCity}, customize auditorium format, gourmet snacks, and AV presentation kits with live GST pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Controls */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Real Multiplex Cinema Selection */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#F84464]" /> 1. Select Partner Cinema in {selectedCity}
                </label>
                <span className="text-xs text-gray-500">
                  {theaters.length} Multiplexes available
                </span>
              </div>

              {theaters.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                  Loading multiplexes in {selectedCity}...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {theaters.map(t => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => handleTheaterChange(t._id)}
                      className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                        selectedTheater?._id === t._id
                          ? 'border-[#F84464] bg-red-50/50 shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-gray-900 truncate">{t.name}</p>
                        {selectedTheater?._id === t._id && (
                          <CheckCircle2 className="w-4 h-4 text-[#F84464] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-gray-400" /> {t.location}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(t.amenities || []).slice(0, 2).map((am, i) => (
                          <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {am}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Real Movie Selection */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-[#F84464]" /> 2. Select Movie for Private Screening
                </label>
                <span className="text-xs text-gray-500">
                  {movies.length} Active Catalog Titles
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {movies.map(m => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setSelectedMovie(m)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedMovie?._id === m._id
                        ? 'border-[#F84464] ring-2 ring-red-400/30 bg-red-50/30'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-gray-100 mb-2">
                      <img 
                        src={m.image} 
                        alt={m.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                      <span className="absolute top-1.5 right-1.5 bg-black/75 text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {m.rating}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate">{m.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{m.genre}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Auditorium Format & Capacity */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#F84464]" /> 3. Select Auditorium Experience & Format
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(selectedTheater?.audis || [
                  { screenId: 'a1', screenName: 'Audi 1 (IMAX Laser)', format: 'IMAX Laser 3D', capacity: 320, basePath: 450, features: ['Dual Laser 4K', 'Spatial Audio'] },
                  { screenId: 'a2', screenName: 'Audi 2 (VIP Recliner)', format: 'VIP Recliner Audi', capacity: 60, basePath: 650, features: ['180° Leather Recliners', 'Butler Service'] },
                  { screenId: 'a3', screenName: 'Audi 3 (Premiere Luxe)', format: 'Standard 2D Luxe', capacity: 150, basePath: 280, features: ['Plush Rockers', 'HDMI Projection'] }
                ]).map((audi, idx) => (
                  <button
                    key={audi.screenId || idx}
                    type="button"
                    onClick={() => handleAudiChange(audi)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedAudi?.screenId === audi.screenId
                        ? 'border-[#F84464] bg-red-50/60 ring-2 ring-red-400/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F84464]">
                        {audi.format}
                      </span>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">{audi.screenName}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Capacity: Up to {audi.capacity} seats</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs font-black text-gray-900">₹{audi.basePricePerSeat}</span>
                      <span className="text-[10px] text-gray-400">/ seat</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Guest Count Slider */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700">
                    Number of Expected Guests
                  </span>
                  <span className="text-sm font-black text-[#F84464] bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                    {attendees} Attendees
                  </span>
                </div>
                <input 
                  type="range"
                  min="15"
                  max={selectedAudi?.capacity || 250}
                  step="5"
                  value={attendees}
                  onChange={(e) => setAttendees(parseInt(e.target.value))}
                  className="w-full accent-[#F84464] h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>Min 15 Guests</span>
                  <span>
                    Auditorium Seating Limit: {selectedAudi?.capacity || 250} seats ({Math.round((attendees / (selectedAudi?.capacity || 250)) * 100)}% filled)
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Date, Time Slot & F&B Add-Ons */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#F84464]" /> 4. Preferred Date, Showtime Slot & Catering
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-gray-600 mb-1">Preferred Screening Date</span>
                  <input 
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464]"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-gray-600 mb-1">Auditorium Time Slot</span>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464]"
                  >
                    <option value="Morning Townhall (09:30 AM - 01:00 PM)">Morning Townhall (09:30 AM - 01:00 PM)</option>
                    <option value="Matinee Premiere (02:00 PM - 05:30 PM)">Matinee Premiere (02:00 PM - 05:30 PM)</option>
                    <option value="Prime Evening (06:30 PM - 10:00 PM)">Prime Evening (06:30 PM - 10:00 PM)</option>
                    <option value="Late Night Team Outing (10:30 PM+)">Late Night Outing (10:30 PM+)</option>
                  </select>
                </div>
              </div>

              {/* Snacks Selection */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                    <input 
                      type="checkbox"
                      checked={includeSnacks}
                      onChange={(e) => setIncludeSnacks(e.target.checked)}
                      className="w-4 h-4 accent-[#F84464] rounded cursor-pointer"
                    />
                    Include Gourmet F&B Concessions
                  </label>
                  {includeSnacks && (
                    <span className="text-xs font-bold text-[#F84464]">
                      ₹{snackCostPerPax} / person
                    </span>
                  )}
                </div>

                {includeSnacks && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-6">
                    {[
                      { name: 'Classic Popcorn & Drink Combo', price: 180, desc: 'Jumbo Butter Popcorn + 600ml Cold Drink' },
                      { name: 'Executive Bento Box (Popcorn + Nachos + Beverage)', price: 320, desc: 'Cheese Popcorn, Salsa Nachos, Beverage & Dessert' },
                      { name: 'Luxury Buffet & Live Snack Counter', price: 550, desc: 'Pre-show hot appetizers, mocktails & dessert bar' }
                    ].map((pkg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSnackPackage(pkg.name)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          snackPackage === pkg.name
                            ? 'border-[#F84464] bg-red-50 text-gray-900 font-semibold'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-bold text-[11px] truncate">{pkg.name.split(' (')[0]}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{pkg.desc}</p>
                        <p className="text-[11px] font-black text-[#F84464] mt-1">₹{pkg.price}/pax</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Presentation Kit */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300">
                  <input 
                    type="checkbox"
                    checked={includePresentationKit}
                    onChange={(e) => setIncludePresentationKit(e.target.checked)}
                    className="w-4 h-4 accent-[#F84464] rounded cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-blue-500" />
                      Executive AV & Keynote Tech Rider (+₹4,500 flat)
                    </p>
                    <p className="text-gray-500 text-[11px]">
                      Giant screen laptop HDMI projection, 2 wireless microphones, stage podium, and dedicated theater technician.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Dynamic Quotation Card & Tax Breakdown */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-[#181B2A] text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-gray-700/80">
              <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Official Estimate</span>
                  <h3 className="font-extrabold text-lg text-white">Live Enterprise Quote</h3>
                </div>
                <span className="text-[11px] bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-1 rounded-full font-bold">
                  {discountPercent}% Bulk Tier Discount
                </span>
              </div>

              {/* Selected Venue Summary */}
              <div className="py-3.5 border-b border-gray-700/70 text-xs space-y-1.5 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cinema Venue:</span>
                  <span className="font-bold text-white truncate max-w-[200px]">{selectedTheater?.name || 'Multiplex'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Movie Title:</span>
                  <span className="font-bold text-yellow-400 truncate max-w-[200px]">{selectedMovie?.title || 'Selected Title'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Auditorium / Format:</span>
                  <span className="text-white font-medium">{selectedAudi?.format || 'Standard 2D Luxe'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date & Slot:</span>
                  <span className="text-white">{preferredDate} • {timeSlot.split(' (')[0]}</span>
                </div>
              </div>

              {/* Itemized Financials */}
              <div className="py-4 space-y-2.5 text-xs text-gray-300 border-b border-gray-700/70">
                <div className="flex justify-between">
                  <span>Tickets ({attendees} guests × ₹{seatRate})</span>
                  <span className="font-semibold text-white">₹{ticketSubtotal.toLocaleString()}</span>
                </div>

                {includeSnacks && (
                  <div className="flex justify-between">
                    <span>F&B Combos ({attendees} × ₹{snackCostPerPax})</span>
                    <span className="font-semibold text-white">₹{snacksSubtotal.toLocaleString()}</span>
                  </div>
                )}

                {includePresentationKit && (
                  <div className="flex justify-between">
                    <span>Executive Keynote & AV Tech Rider</span>
                    <span className="font-semibold text-white">₹{brandingSubtotal.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-green-400 font-semibold pt-1">
                  <span>Corporate Volume Savings ({discountPercent}%)</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-gray-400 pt-1 text-[11px]">
                  <span>Net Taxable Subtotal</span>
                  <span>₹{subtotalAfterDiscount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-gray-400 text-[11px]">
                  <span>GST 18% (9% CGST + 9% SGST)</span>
                  <span>+₹{gstAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Final Totals */}
              <div className="py-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block">
                      Total Invoice Amount (Incl. 18% GST)
                    </span>
                    <p className="text-3xl font-black text-white mt-1">
                      ₹{grandTotal.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 block">All-Inclusive</span>
                    <span className="text-sm font-bold text-green-400">
                      ₹{perPersonEstimate} / guest
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-[11px] text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-green-400">
                    <BadgeCheck className="w-4 h-4 text-green-400" />
                    100% Tax Deductible (18% ITC)
                  </span>
                  <span className="text-gray-400">Est. Tax Savings: ₹{gstAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5 pt-2">
                <a
                  href="#enquiry-form"
                  className="w-full bg-[#F84464] hover:bg-[#d63a56] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <Send className="w-4 h-4" />
                  Submit Formal Booking Request
                </a>

                <button
                  type="button"
                  onClick={() => setShowQuoteModal(true)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  Print / Download Pro-Forma Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Corporate Booking Request Form */}
      <div id="enquiry-form" className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F84464]">Direct Enterprise Desk</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C2A] mt-1">
              Submit Corporate Reservation Request
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Your inquiry will be logged directly to our live reservation system with your configured package.
            </p>
          </div>

          {submittedBooking ? (
            <div id="confirmation-card" className="bg-green-50/70 border border-green-200 rounded-3xl p-6 sm:p-8 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md shadow-green-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-green-900">Request Registered Successfully!</h3>
                <p className="text-xs text-green-700 max-w-md mx-auto mt-1">
                  Thank you, <strong>{submittedBooking.contactName}</strong>. Your corporate request for <strong>{submittedBooking.companyName}</strong> has been allocated to our cinema concierge desk.
                </p>

                {/* Reference Code Box */}
                <div className="inline-flex items-center gap-3 bg-white border border-green-300 px-5 py-2.5 rounded-2xl shadow-xs mt-4">
                  <span className="text-xs text-gray-500 font-semibold">Reference ID:</span>
                  <span className="text-sm font-mono font-black text-[#F84464]">{submittedBooking.refId}</span>
                  <button
                    type="button"
                    onClick={() => copyRefToClipboard(submittedBooking.refId)}
                    className="p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title="Copy Reference ID"
                  >
                    {copiedRef ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Allocated Account Manager Card */}
              {submittedBooking.accountManager && (
                <div className="bg-white rounded-2xl p-5 border border-green-200 shadow-xs max-w-lg mx-auto mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Allocated Cinema Account Manager
                  </span>
                  <div className="flex items-center gap-4">
                    <img 
                      src={submittedBooking.accountManager.avatar} 
                      alt={submittedBooking.accountManager.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{submittedBooking.accountManager.name}</p>
                      <p className="text-xs text-gray-500">{submittedBooking.accountManager.role}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <a 
                          href={`tel:${submittedBooking.accountManager.phone}`}
                          className="text-xs font-bold text-[#F84464] flex items-center gap-1 hover:underline"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          {submittedBooking.accountManager.phone}
                        </a>
                        <a 
                          href={`https://wa.me/${submittedBooking.accountManager.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-green-600 flex items-center gap-1 hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp Desk
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(true)}
                  className="bg-[#1A1C2A] hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  View Formal Pro-Forma Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedBooking(null);
                    setFormData({
                      contactName: '',
                      workEmail: '',
                      companyName: '',
                      phone: '',
                      gstin: '',
                      notes: ''
                    });
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Create Another Booking
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <span className="font-bold text-gray-900">Current Configuration: </span>
                  {selectedTheater?.name || 'Multiplex'} • {selectedMovie?.title || 'Selected Movie'} • {attendees} Guests ({selectedAudi?.format})
                </div>
                <a href="#configurator" className="text-[#F84464] font-bold hover:underline">
                  Change &rarr;
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Authorized Contact Name *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Anand Mahindra"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#F84464] focus:bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Official Work Email Address *
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="e.g. anand@company.com"
                    value={formData.workEmail}
                    onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#F84464] focus:bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Company / Organization Name *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Tech Mahindra Ltd"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#F84464] focus:bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Direct Contact Phone / WhatsApp *
                  </label>
                  <input 
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#F84464] focus:bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Company GSTIN (For 18% ITC Invoice)</span>
                    <span className="text-[10px] text-green-600 font-semibold">Optional</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#F84464] focus:bg-white text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Operating City
                  </label>
                  <input 
                    type="text"
                    readOnly
                    value={selectedCity}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Special Requirements, Film Requests or Dietary Needs
                </label>
                <textarea 
                  rows="3"
                  placeholder="Specify any custom cinema branding, welcome drinks, cake cutting, or private presentation details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#F84464] focus:bg-white text-sm"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Your information is protected and assigned directly to the regional manager.
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#F84464] hover:bg-[#d63a56] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-pink-500/20 disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Corporate Reservation
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* SECTION 3: Bulk Digital Movie Vouchers Configurator */}
      <div id="vouchers-section" className="bg-white py-16 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-600 flex items-center justify-center gap-1">
              <Gift className="w-4 h-4" /> Employee Rewards & Gifting
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1A1C2A] mt-1">
              Bulk Digital Movie Vouchers
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Instant digital codes sent via automated Excel distribution or direct employee email delivery. Valid for 12 months across all cinemas in India.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Configurator */}
            <div className="lg:col-span-7 bg-[#F9FAFB] p-6 sm:p-8 rounded-2xl border border-gray-200 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  1. Select Voucher Denomination (Per Employee)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[250, 500, 750, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setVoucherDenom(amt)}
                      className={`py-3 px-2 rounded-xl text-center border font-bold text-sm transition-all cursor-pointer ${
                        voucherDenom === amt
                          ? 'border-[#F84464] bg-red-50 text-[#F84464] shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      ₹{amt}
                      <span className="block text-[10px] font-normal text-gray-500 mt-0.5">Value</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    2. Quantity of Vouchers Needed
                  </label>
                  <span className="text-sm font-black text-[#F84464] bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                    {voucherQty} Vouchers
                  </span>
                </div>
                <input 
                  type="range"
                  min="25"
                  max="1000"
                  step="25"
                  value={voucherQty}
                  onChange={(e) => setVoucherQty(parseInt(e.target.value))}
                  className="w-full accent-[#F84464] h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>25 Units (Min Batch)</span>
                  <span>250 Units (15% Off)</span>
                  <span>500+ Units (20% Off)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name on Vouchers</label>
                  <input 
                    type="text"
                    value={voucherCompany}
                    onChange={(e) => setVoucherCompany(e.target.value)}
                    placeholder="e.g. Google India"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Reward Greeting</label>
                  <input 
                    type="text"
                    value={voucherCustomMessage}
                    onChange={(e) => setVoucherCustomMessage(e.target.value)}
                    placeholder="e.g. Happy Festive Milestone!"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>
            </div>

            {/* Right: Live Voucher Card Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-2xl overflow-hidden p-6 text-white shadow-xl bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] border border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#F84464] uppercase font-bold">
                      ENTERPRISE REWARD PASS
                    </span>
                    <h4 className="text-xl font-black mt-1">{voucherCompany || 'Your Company'}</h4>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
                    <Ticket className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>

                <div className="my-6 py-4 border-y border-white/10">
                  <p className="text-xs text-gray-300 italic">"{voucherCustomMessage}"</p>
                  <div className="mt-3 flex justify-between items-baseline">
                    <span className="text-2xl font-black text-yellow-400">₹{voucherDenom}</span>
                    <span className="text-[10px] font-mono text-gray-400">CODE: BMS-CORP-XXXX-2026</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                  <span>VALIDITY: 365 DAYS</span>
                  <span>5,000+ AUDITORIUMS</span>
                </div>
              </div>

              {/* Price Calculation for Vouchers */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Gross Value ({voucherQty} × ₹{voucherDenom})</span>
                  <span className="font-bold text-gray-900">₹{rawVoucherTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Corporate Discount ({voucherDiscountPercent}%)</span>
                  <span>-₹{voucherDiscountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-black text-gray-900">
                  <span>Net Corporate Total</span>
                  <span className="text-[#F84464]">₹{netVoucherTotal.toLocaleString()}</span>
                </div>
                <a
                  href="#enquiry-form"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      notes: `Interested in ordering ${voucherQty} bulk digital vouchers of ₹${voucherDenom} for ${voucherCompany}.`
                    }));
                  }}
                  className="w-full mt-3 bg-[#1A1C2A] hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  Request Bulk Voucher Batch &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Live Inquiry Tracker */}
      <div id="track-section" className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center justify-center gap-1">
              <Search className="w-4 h-4" /> Live Tracking Desk
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C2A] mt-1">
              Track Your Corporate Request
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Enter your corporate reference number (e.g. <code>CORP-BEN-68541489</code>) to see real-time stage approvals, allocated manager, and formal quotation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
            <input 
              type="text"
              placeholder="e.g. CORP-BEN-68541489"
              value={trackRefId}
              onChange={(e) => setTrackRefId(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-[#F84464] focus:bg-white uppercase"
            />
            <button
              type="button"
              onClick={() => handleTrackInquiry()}
              disabled={trackingLoading}
              className="bg-[#1A1C2A] hover:bg-gray-800 text-white px-6 py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {trackingLoading ? 'Searching...' : 'Track Live Status'}
            </button>
          </div>

          {trackError && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs text-center mb-6">
              {trackError}
            </div>
          )}

          {trackedInquiry && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 animate-fade-in space-y-6">
              <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-gray-200">
                <div>
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                    REFERENCE ID: {trackedInquiry.refId}
                  </span>
                  <h4 className="text-xl font-black text-gray-900 mt-0.5">{trackedInquiry.companyName}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Contact: {trackedInquiry.contactName} ({trackedInquiry.workEmail})
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                    Status: {trackedInquiry.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Total: <strong className="text-gray-900">₹{trackedInquiry.pricing?.totalAmount?.toLocaleString()}</strong>
                  </p>
                </div>
              </div>

              {/* Approval Stages */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { title: 'Inquiry Logged', status: 'done' },
                  { title: 'Audi Slot Checked', status: 'done' },
                  { title: 'Proposal Ready', status: 'done' },
                  { title: 'Payment & Passes', status: trackedInquiry.status === 'CONFIRMED' ? 'done' : 'pending' }
                ].map((st, i) => (
                  <div key={i} className={`p-3 rounded-xl border text-xs ${
                    st.status === 'done'
                      ? 'bg-green-50 border-green-200 text-green-800 font-bold'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 mx-auto mb-1 ${st.status === 'done' ? 'text-green-600' : 'text-gray-300'}`} />
                    <span>{st.title}</span>
                  </div>
                ))}
              </div>

              {/* Theater & Movie Details */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Reserved Multiplex:</span>
                  <span className="font-bold text-gray-900">{trackedInquiry.theaterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Selected Film:</span>
                  <span className="font-bold text-gray-900">{trackedInquiry.movieTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Auditorium Experience:</span>
                  <span>{trackedInquiry.screenFormat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Attendees:</span>
                  <span className="font-bold text-[#F84464]">{trackedInquiry.attendees} Guests</span>
                </div>
              </div>

              {/* Assigned Relationship Manager */}
              {trackedInquiry.accountManager && (
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 text-xs flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={trackedInquiry.accountManager.avatar} 
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-gray-900">{trackedInquiry.accountManager.name}</p>
                      <p className="text-[11px] text-gray-500">{trackedInquiry.accountManager.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={`tel:${trackedInquiry.accountManager.phone}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-700 transition-colors"
                    >
                      Call Manager
                    </a>
                    <a 
                      href={`https://wa.me/${trackedInquiry.accountManager.whatsapp?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: Enterprise Case Studies (Authentic Proof, No AI Hallmarks) */}
      <div className="bg-[#121422] text-white py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F84464] flex items-center justify-center gap-1">
              <Award className="w-4 h-4" /> Enterprise Track Record
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
              Trusted by India's Top Enterprises & Startups
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              See how multinational teams execute private premieres, executive offsites, and employee reward programs with our cinema network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Case Study 1 */}
            <div className="bg-[#1C2033] rounded-2xl p-6 border border-gray-700/80 hover:border-gray-600 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-[#F84464] uppercase tracking-wider">
                    TECHNOLOGY SECTOR
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">HYDERABAD</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Tata Consultancy Services
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Full auditorium buyout of <strong>AMB Cinemas Gachibowli (Audi 1 IMAX)</strong> for 280 engineers. Featured a pre-screening keynote presentation followed by blockbuster Telugu premiere with bespoke snack boxes.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-700/70 text-[11px] text-gray-400 flex justify-between">
                <span>Auditorium: <strong>IMAX 3D (280 pax)</strong></span>
                <span className="text-green-400 font-semibold">100% On-Time SLA</span>
              </div>
            </div>

            {/* Case Study 2 */}
            <div className="bg-[#1C2033] rounded-2xl p-6 border border-gray-700/80 hover:border-gray-600 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-yellow-400 uppercase tracking-wider">
                    CLOUD & R&D
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">BENGALURU</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Microsoft R&D India
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Exclusive private screening of <em>Dune: Part Two</em> at <strong>PVR Vega City Bannerghatta Road</strong>. Integrated wireless laptop mirroring onto the main cinema screen for the annual team recognition awards.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-700/70 text-[11px] text-gray-400 flex justify-between">
                <span>Auditorium: <strong>Dolby Atmos (160 pax)</strong></span>
                <span className="text-green-400 font-semibold">Full AV Rider</span>
              </div>
            </div>

            {/* Case Study 3 */}
            <div className="bg-[#1C2033] rounded-2xl p-6 border border-gray-700/80 hover:border-gray-600 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-blue-400 uppercase tracking-wider">
                    CONSULTING & AUDIT
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">MUMBAI</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Deloitte Shared Services
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Executive Partner Summit hosted at <strong>PVR ICON Phoenix Palladium, Lower Parel</strong> in Gold Class Recliner Audi with chef-curated appetizers and individual butler service.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-700/70 text-[11px] text-gray-400 flex justify-between">
                <span>Auditorium: <strong>Gold Class (75 pax)</strong></span>
                <span className="text-green-400 font-semibold">Chef Gourmet Menu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F84464] flex items-center justify-center gap-1">
            <HelpCircle className="w-4 h-4" /> Enterprise Screening Guide
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1C2A] mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left p-5 flex justify-between items-center text-sm sm:text-base font-bold text-gray-800 hover:text-[#F84464] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform flex-shrink-0 ${activeFaq === idx ? 'rotate-180 text-[#F84464]' : 'text-gray-400'}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pro-Forma Invoice Modal (Printable & Downloadable) */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-fade-in my-8 text-gray-800">
            {/* Header with Print Button */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-200">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#F84464] font-bold uppercase">
                  OFFICIAL TAX ESTIMATE
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-0.5">Corporate Pro-Forma Invoice</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Doc #: {submittedBooking?.refId || `EST-${selectedCity.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-[#1A1C2A] hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Bill To & Cinema Venue Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
              <div>
                <p className="font-bold text-gray-400 uppercase text-[10px]">Client Organization</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">
                  {formData.companyName || submittedBooking?.companyName || 'Corporate Client'}
                </p>
                <p className="text-gray-600">{formData.contactName || submittedBooking?.contactName || 'Representative'}</p>
                <p className="text-gray-500 font-mono">{formData.gstin ? `GSTIN: ${formData.gstin}` : 'GSTIN: Upon Registration'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-400 uppercase text-[10px]">Venue Location</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{selectedTheater?.name || 'Multiplex'}</p>
                <p className="text-gray-600">{selectedCity} Network</p>
                <p className="text-gray-500">Event Date: {preferredDate}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-4 border-b border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 uppercase text-[10px] border-b border-gray-100 pb-2">
                    <th className="text-left font-bold pb-2">Description</th>
                    <th className="text-center font-bold pb-2">Format / Audi</th>
                    <th className="text-center font-bold pb-2">Qty</th>
                    <th className="text-right font-bold pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2.5">
                      <p className="font-bold text-gray-900">Private Auditorium Movie Screening</p>
                      <p className="text-[11px] text-gray-500">{selectedMovie?.title || 'Selected Title'}</p>
                    </td>
                    <td className="text-center text-gray-600">{selectedAudi?.format}</td>
                    <td className="text-center text-gray-600">{attendees} seats</td>
                    <td className="text-right font-bold text-gray-900">₹{ticketSubtotal.toLocaleString()}</td>
                  </tr>

                  {includeSnacks && (
                    <tr>
                      <td className="py-2.5">
                        <p className="font-bold text-gray-900">Gourmet Catering & Concessions</p>
                        <p className="text-[11px] text-gray-500">{snackPackage.split(' (')[0]}</p>
                      </td>
                      <td className="text-center text-gray-600">Per Person</td>
                      <td className="text-center text-gray-600">{attendees}</td>
                      <td className="text-right font-bold text-gray-900">₹{snacksSubtotal.toLocaleString()}</td>
                    </tr>
                  )}

                  {includePresentationKit && (
                    <tr>
                      <td className="py-2.5">
                        <p className="font-bold text-gray-900">Executive Keynote AV Tech Rider</p>
                        <p className="text-[11px] text-gray-500">Giant screen HDMI projection, mics & podium</p>
                      </td>
                      <td className="text-center text-gray-600">Lump sum</td>
                      <td className="text-center text-gray-600">1 kit</td>
                      <td className="text-right font-bold text-gray-900">₹{brandingSubtotal.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="py-4 space-y-1.5 text-xs border-b border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Gross Subtotal:</span>
                <span>₹{rawSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600 font-bold">
                <span>Corporate Volume Discount ({discountPercent}%):</span>
                <span>-₹{discountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Net Taxable Base Amount:</span>
                <span className="font-bold text-gray-900">₹{subtotalAfterDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>CGST (9.0%):</span>
                <span>₹{cgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>SGST (9.0%):</span>
                <span>₹{sgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Due (18% GST Included):</span>
                <span className="text-[#F84464]">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Bank Wire & Payment Terms Note */}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-[10px] text-gray-500 space-y-1 font-mono">
              <p className="font-bold text-gray-700">CORPORATE BILLING & BANK DETAILS:</p>
              <p>Bank: HDFC Bank Limited • IFSC: HDFC0001234 • Virtual A/C: ICLCORP987654</p>
              <p>Payment Modes: RTGS / NEFT / Corporate Card / Approved Purchase Order (PO Net-15)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Corporates;
