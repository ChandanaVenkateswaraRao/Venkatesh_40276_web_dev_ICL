import { X, Printer, CheckCircle, MapPin, Calendar, Clock, Armchair, CalendarPlus } from 'lucide-react';
import { downloadIcsCalendar } from '../utils/calendar';

const TicketPassModal = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleAddToCalendar = () => {
    downloadIcsCalendar({
      title: booking.movie?.title,
      theater: booking.showtime?.theaterId?.name,
      time: booking.showtime?.time,
      seats: booking.seats,
      bookingId: booking._id
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Modal Close & Action Bar (Hidden when printing) */}
        <div className="flex justify-between items-center px-6 py-3 bg-[#1F2533] text-white print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Official E-Ticket</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCalendar}
              title="Add showtime to Apple / Google Calendar"
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-rose-400" />
              <span>Add to Calendar</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#F84464] hover:bg-[#d63a56] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Stub Container */}
        <div className="p-6 sm:p-8 bg-white print:p-8" id="printable-ticket">
          
          {/* Header Branding */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
            <img 
              src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
              alt="BookMyShow" 
              className="h-8 w-auto" 
            />
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>BOOKING CONFIRMED</span>
            </div>
          </div>

          {/* Movie Banner & Info */}
          <div className="flex gap-4 mb-6">
            <img 
              src={booking.movie?.image} 
              alt={booking.movie?.title} 
              className="w-20 h-28 object-cover rounded-xl shadow-md flex-shrink-0 bg-gray-100" 
            />
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">
                  {booking.movie?.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {booking.movie?.language} • 2D • UA
                </p>
              </div>

              <div className="text-xs text-gray-600 space-y-0.5">
                <p className="flex items-center gap-1 font-semibold text-gray-800">
                  <MapPin className="w-3.5 h-3.5 text-[#F84464]" />
                  <span>{booking.showtime?.theaterId?.name || 'Multiplex Cinema'}</span>
                </p>
                <p className="flex items-center gap-1 text-gray-500 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(booking.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="mx-1">•</span>
                  <Clock className="w-3 h-3" />
                  <span>{booking.showtime?.time || 'Evening Show'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Perforated Stub Divider */}
          <div className="relative my-6">
            <div className="border-t-2 border-dashed border-gray-200"></div>
            {/* Cutout Notches */}
            <div className="absolute -left-10 sm:-left-12 -top-3 w-6 h-6 rounded-full bg-black/80 print:hidden"></div>
            <div className="absolute -right-10 sm:-right-12 -top-3 w-6 h-6 rounded-full bg-black/80 print:hidden"></div>
          </div>

          {/* Seats & Booking Meta */}
          <div className="grid grid-cols-2 gap-4 bg-[#F8F9FA] p-4 rounded-2xl mb-6 border border-gray-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Seats ({booking.seats?.length} Tickets)
              </span>
              <p className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <Armchair className="w-4 h-4 text-[#F84464]" />
                {booking.seats?.join(', ')}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Total Paid
              </span>
              <p className="text-base font-black text-[#1EA83C]">
                ₹{booking.totalAmount}
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-gray-200/60 flex justify-between items-center text-[11px] text-gray-500 flex-wrap gap-1">
              <span>Booking ID: <strong className="font-mono text-gray-800">{booking._id}</strong></span>
              <span>
                Payment: {booking.paymentMethod === 'wallet' ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    💳 BMS Wallet (100%)
                  </span>
                ) : booking.paymentMethod === 'split' ? (
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Split (₹{booking.walletAmountDeducted} Wallet + ₹{booking.razorpayAmountPaid} Online)
                  </span>
                ) : (
                  <span className="font-bold text-gray-700">Online / Razorpay</span>
                )}
              </span>
            </div>
          </div>

          {/* QR Code Validation Section */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-200 text-center">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=TICKET:${booking._id}`} 
              alt="Booking QR Code" 
              className="w-32 h-32 border-4 border-gray-50 rounded-xl shadow-xs" 
            />
            <p className="text-xs font-bold text-gray-800 mt-2">Scan QR Code at the Cinema Turnstile</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
              Instant entry • M-Ticket verified
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TicketPassModal;
