import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Clock, Users, ShieldAlert, Sparkles, Armchair, CheckCircle2 } from 'lucide-react';
import FoodAndBeverageModal from '../components/FoodAndBeverageModal';
import PaymentModal from '../components/PaymentModal';
import TicketPassModal from '../components/TicketPassModal';
import getSocket from '../utils/socket';

const Booking = () => {
  const { id } = useParams(); // showtimeId
  const location = useLocation();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState(null);
  const [showtime, setShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [lockedByOthers, setLockedByOthers] = useState({});
  const [viewersCount, setViewersCount] = useState(1);
  const [timeLeft, setTimeLeft] = useState(480); // 8 minutes countdown

  // Modals state
  const [isFnbModalOpen, setIsFnbModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({ grandTotal: 0, fnbTotal: 0 });
  
  const token = localStorage.getItem('token');
  const searchParams = new URLSearchParams(location.search);
  const allowedQuantity = parseInt(searchParams.get('quantity')) || 1;

  // 1. Setup Real-time WebSockets with Socket.IO
  useEffect(() => {
    const socket = getSocket();

    socket.emit('join_showtime', { showtimeId: id, userId: token });

    socket.on('initial_locks', (locks) => {
      const others = {};
      for (const [sId, info] of Object.entries(locks)) {
        if (info.socketId !== socket.id) {
          others[sId] = info;
        }
      }
      setLockedByOthers(others);
    });

    socket.on('viewers_count', (count) => {
      setViewersCount(count);
    });

    socket.on('seat_locked_by_other', ({ seatId, socketId, userId }) => {
      if (socketId !== socket.id) {
        setLockedByOthers(prev => ({ ...prev, [seatId]: { socketId, userId } }));
      }
    });

    socket.on('seat_unlocked', ({ seatId }) => {
      setLockedByOthers(prev => {
        const copy = { ...prev };
        delete copy[seatId];
        return copy;
      });
    });

    socket.on('seats_released', ({ seats }) => {
      setLockedByOthers(prev => {
        const copy = { ...prev };
        seats.forEach(s => delete copy[s]);
        return copy;
      });
    });

    socket.on('seats_permanently_booked', ({ seats }) => {
      setBookedSeats(prev => [...new Set([...prev, ...seats])]);
      setLockedByOthers(prev => {
        const copy = { ...prev };
        seats.forEach(s => delete copy[s]);
        return copy;
      });
    });

    socket.on('seat_lock_failed', ({ seatId, msg }) => {
      alert(msg);
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    });

    return () => {
      socket.off('initial_locks');
      socket.off('viewers_count');
      socket.off('seat_locked_by_other');
      socket.off('seat_unlocked');
      socket.off('seats_released');
      socket.off('seats_permanently_booked');
      socket.off('seat_lock_failed');
    };
  }, [id, token]);

  // 2. 8-Minute Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('Your 8-minute reservation time has expired. Please select your seats again.');
          navigate(`/buytickets/${movie?._id || ''}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [movie, navigate]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchShowtimeData = async () => {
      try {
        const [showRes, bookedRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/theaters/showtime/${id}`),
          axios.get(`http://localhost:5000/api/theaters/showtime/${id}/booked-seats`)
        ]);
        setShowtime(showRes.data);
        setMovie(showRes.data.movieId);
        setBookedSeats(bookedRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchShowtimeData();
  }, [id, token, navigate]);

  // 3. Toggle & Lock Seat with Real-time Broadcast
  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    if (lockedByOthers[seatId]) {
      alert('This seat is temporarily locked by another user selecting tickets right now.');
      return;
    }

    const socket = getSocket();

    if (selectedSeats.includes(seatId)) {
      // Deselect and release lock
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
      socket.emit('unlock_seat', { showtimeId: id, seatId });
    } else {
      if (selectedSeats.length >= allowedQuantity) {
        // Shift oldest seat out and unlock it
        const newArr = [...selectedSeats];
        const oldest = newArr.shift();
        socket.emit('unlock_seat', { showtimeId: id, seatId: oldest });

        // Add new seat and lock it
        setSelectedSeats([...newArr, seatId]);
        socket.emit('lock_seat', { showtimeId: id, seatId, userId: token });
      } else {
        setSelectedSeats([...selectedSeats, seatId]);
        socket.emit('lock_seat', { showtimeId: id, seatId, userId: token });
      }
    }
  };

  const handleOpenFnb = () => {
    if (selectedSeats.length !== allowedQuantity) {
      alert(`Please select exactly ${allowedQuantity} seats`);
      return;
    }
    setIsFnbModalOpen(true);
  };

  // From F&B Modal to Payment Modal
  const handleProceedToPaymentModal = ({ grandTotal, fnbTotal }) => {
    setIsFnbModalOpen(false);
    setPaymentAmounts({ grandTotal, fnbTotal });
    setIsPaymentModalOpen(true);
  };

  // Finalize payment from PaymentModal
  const handleFinalizePayment = async (simulatedPaymentData) => {
    setIsPaymentModalOpen(false);

    try {
      const payload = {
        razorpay_order_id: simulatedPaymentData.razorpay_order_id,
        razorpay_payment_id: simulatedPaymentData.razorpay_payment_id,
        razorpay_signature: 'simulated_signature',
        movieId: movie._id,
        showtimeId: id,
        seats: selectedSeats,
        amount: paymentAmounts.grandTotal,
        fnbAmount: paymentAmounts.fnbTotal || 0
      };

      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post('http://localhost:5000/api/payment/verify', payload, { headers });

      // Store confirmed booking and pop up E-Ticket Pass Modal with QR code and Calendar button!
      setConfirmedBooking(res.data.booking);
      setIsPassModalOpen(true);
    } catch (err) {
      console.error('Payment verification failed:', err);
      alert('Payment verification failed. Please try again.');
    }
  };

  if (!movie || !showtime) return (
    <div className="flex justify-center items-center h-screen bg-[#F5F5F5]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F84464]"></div>
    </div>
  );

  // Seating Tiers & Pricing
  const pricePremium = showtime.pricePremium || 350;
  const priceExecutive = showtime.priceExecutive || 200;
  const priceRecliner = pricePremium + 120; // Royal Recliner Lounge Tier

  const reclinerRows = ['A', 'B'];
  const primeRows = ['C', 'D', 'E', 'F'];
  const classicRows = ['G', 'H', 'I', 'J'];

  const cols = [1, 2, 3, 4, 5, '', 6, 7, 8, 9, 10, 11, 12, '', 13, 14, 15, 16, 17];
  const reclinerCols = [1, 2, '', 3, 4, '', 5, 6, '', 7, 8, '', 9, 10];

  const calculateTotal = () => {
    let total = 0;
    selectedSeats.forEach(seat => {
      const row = seat.charAt(0);
      if (reclinerRows.includes(row)) total += priceRecliner;
      else if (primeRows.includes(row)) total += pricePremium;
      else total += priceExecutive;
    });
    return total;
  };

  const renderSeatRow = (row, isRecliner = false) => {
    const colList = isRecliner ? reclinerCols : cols;

    return (
      <div key={row} className={`flex items-center justify-center gap-1.5 ${isRecliner ? 'mb-3' : 'mb-2'}`}>
        <span className="w-6 text-xs font-bold text-gray-400 text-center">{row}</span>
        <div className="flex gap-1.5">
          {colList.map((col, idx) => {
            if (col === '') {
              return <div key={`spacer-${idx}`} className={isRecliner ? 'w-6' : 'w-4'} />;
            }
            
            const seatId = `${row}${col}`;
            const isSelected = selectedSeats.includes(seatId);
            const isBooked = bookedSeats.includes(seatId);
            const isLockedByOther = Boolean(lockedByOthers[seatId]);

            let seatClasses = "border rounded text-xs transition-all relative font-semibold ";
            if (isRecliner) {
              seatClasses += "w-9 h-8 md:w-11 md:h-9 rounded-lg flex items-center justify-center ";
            } else {
              seatClasses += "w-7 h-7 md:w-8 md:h-8 flex items-center justify-center ";
            }

            if (isBooked) {
              seatClasses += "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";
            } else if (isSelected) {
              seatClasses += "bg-[#1EA83C] text-white border-[#1EA83C] shadow-md scale-105";
            } else if (isLockedByOther) {
              seatClasses += "bg-amber-100 border-amber-400 text-amber-800 cursor-not-allowed animate-pulse shadow-xs";
            } else {
              seatClasses += "border-green-600/80 text-green-800 hover:bg-green-500 hover:text-white cursor-pointer active:scale-95";
            }

            return (
              <button
                key={seatId}
                disabled={isBooked || isLockedByOther}
                onClick={() => toggleSeat(seatId)}
                className={seatClasses}
                title={
                  isBooked 
                    ? `Seat ${seatId} is Sold Out` 
                    : isLockedByOther 
                    ? `Seat ${seatId} is held by another user in real-time` 
                    : `Select Seat ${seatId}`
                }
              >
                {isRecliner ? (
                  <span className="text-[11px] font-bold flex items-center gap-0.5">
                    {col}
                  </span>
                ) : (
                  col
                )}
                
                {isLockedByOther && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-24">
      
      {/* Top Bar with Real-time Viewers & Reservation Timer */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ChevronLeft className="w-6 h-6 text-gray-600 cursor-pointer" onClick={() => navigate(-1)} />
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#333333]">{movie.title}</h2>
              <p className="text-xs md:text-sm text-gray-500">
                {showtime.theaterId?.name} {showtime.screen ? `• ${showtime.screen}` : ''} | Today, {showtime.time}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Real-Time Live Viewers Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>{viewersCount} viewing now</span>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
              <span>Lock: {formatTimer(timeLeft)}</span>
            </div>

            <div className="text-xs font-semibold border border-[#F84464] text-[#F84464] px-3 py-1 rounded-full items-center gap-1 flex">
              <span>{selectedSeats.length} / {allowedQuantity} Tickets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Legend Strip */}
      <div className="bg-[#FAF9F8] border-b border-gray-200 py-2.5">
        <div className="container mx-auto px-4 max-w-5xl flex items-center justify-center gap-6 text-xs text-gray-600 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-green-500 bg-white"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#1EA83C]"></span>
            <span className="font-semibold text-green-800">Selected by You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 animate-pulse"></span>
            <span className="font-semibold text-amber-700">Held by Others (Live)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-gray-200 border border-gray-300"></span>
            <span>Sold Out</span>
          </div>
        </div>
      </div>

      {/* Auditorium Screen & Seating Layout Container */}
      <div className="container mx-auto px-4 py-8 overflow-x-auto">
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-md min-w-[840px] max-w-5xl mx-auto border border-gray-100">
          
          {/* CURVED NEON SCREEN PROJECTION ARC (Top of Auditorium) */}
          <div className="w-full flex flex-col items-center mb-10 pt-2">
            <div className="relative w-full max-w-2xl flex justify-center">
              <svg className="w-full h-12" viewBox="0 0 500 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="screenGlow" x1="0%" y1="0%" x2="100%" y2="0%">
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
                  stroke="url(#screenGlow)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.35em] text-slate-400 mt-1">
              <span>Auditorium Screen This Way</span>
            </div>
            <div className="w-36 h-0.5 bg-gradient-to-r from-transparent via-[#818cf8]/50 to-transparent mt-1"></div>
          </div>

          {/* SEATING TIERS */}
          <div className="flex flex-col items-center">
            
            {/* TIER 1: ROYAL RECLINER LOUNGE */}
            <div className="w-full mb-3 pl-8 flex items-center justify-between border-b border-rose-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-50 text-amber-600">
                  <Armchair className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Royal Recliner Lounge
                </span>
              </div>
              <span className="text-xs font-black text-[#F84464]">₹ {priceRecliner}</span>
            </div>
            <div className="mb-6">
              {reclinerRows.map(row => renderSeatRow(row, true))}
            </div>

            {/* TIER 2: PRIME CIRCLE */}
            <div className="w-full mb-3 pl-8 flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Prime Circle
              </span>
              <span className="text-xs font-black text-gray-900">₹ {pricePremium}</span>
            </div>
            <div className="mb-6">
              {primeRows.map(row => renderSeatRow(row, false))}
            </div>
            
            {/* TIER 3: CLASSIC SECTION */}
            <div className="w-full mb-3 pl-8 flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Classic Section
              </span>
              <span className="text-xs font-bold text-gray-600">₹ {priceExecutive}</span>
            </div>
            <div>
              {classicRows.map(row => renderSeatRow(row, false))}
            </div>

          </div>
          
        </div>
      </div>

      {/* Bottom Sticky Payment Bar */}
      {selectedSeats.length === allowedQuantity && (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-4px_15px_rgba(0,0,0,0.08)] border-t z-40 animate-fade-in-up">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-5xl">
            <div className="text-gray-800 text-sm md:text-base">
              Seats: <span className="font-bold text-gray-900">{selectedSeats.join(', ')}</span>
              <span className="text-gray-300 mx-2">|</span>
              Total: <span className="font-black text-xl ml-1 text-green-700">₹{calculateTotal()}</span>
            </div>
            <button 
              onClick={handleOpenFnb}
              className="bg-[#F84464] hover:bg-[#d63a56] text-white px-8 md:px-12 py-3 rounded-xl font-bold text-base transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: Grab a Bite (F&B Addon) */}
      <FoodAndBeverageModal
        isOpen={isFnbModalOpen}
        onClose={() => setIsFnbModalOpen(false)}
        ticketTotal={calculateTotal()}
        onProceedToPayment={handleProceedToPaymentModal}
      />

      {/* Modal 2: Simulated Interactive Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={paymentAmounts.grandTotal}
        movieTitle={movie?.title}
        onConfirmPayment={handleFinalizePayment}
      />

      {/* Modal 3: Confirmed Ticket Pass Modal with QR code and Add to Calendar */}
      {confirmedBooking && (
        <TicketPassModal
          isOpen={isPassModalOpen}
          onClose={() => {
            setIsPassModalOpen(false);
            navigate('/profile');
          }}
          booking={confirmedBooking}
        />
      )}

    </div>
  );
};

export default Booking;
