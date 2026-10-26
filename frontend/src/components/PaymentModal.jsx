import { useState, useEffect } from 'react';
import { X, ShieldCheck, QrCode, CreditCard, Building2, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, totalAmount, movieTitle, onConfirmPayment }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 mins

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onConfirmPayment({
        razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 11)}`,
        razorpay_order_id: `order_${Math.random().toString(36).substring(2, 11)}`,
        razorpay_signature: 'simulated_signature'
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col">
        
        {/* Modal Brand Bar */}
        <div className="bg-[#1F2533] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F84464] flex items-center justify-center font-black text-sm italic">
              BMS
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">bookmyshow Secure Checkout</h3>
              <p className="text-[11px] text-gray-400">100% Secure 256-bit Encrypted Payment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary Strip */}
        <div className="bg-slate-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500">Booking for: </span>
            <strong className="text-gray-800">{movieTitle || 'Movie Tickets'}</strong>
          </div>
          <div className="text-right">
            <span className="text-gray-500 text-[10px] block">TOTAL PAYABLE</span>
            <span className="text-lg font-black text-[#1EA83C]">₹{totalAmount}</span>
          </div>
        </div>

        {/* Payment Methods Body */}
        <div className="p-6">
          
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl mb-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('upi')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#F84464]" />
              <span>UPI / QR</span>
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Card</span>
            </button>
            <button
              onClick={() => setActiveTab('netbanking')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'netbanking' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>NetBanking</span>
            </button>
          </div>

          {/* TAB 1: UPI QR CODE */}
          {activeTab === 'upi' && (
            <div className="flex flex-col items-center text-center py-2 animate-fade-in">
              <div className="p-3 bg-white border-2 border-dashed border-[#F84464]/40 rounded-2xl shadow-sm mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=quickshow@razorpay&pn=QuickShow&am=${totalAmount}&cu=INR`}
                  alt="UPI QR Code"
                  className="w-36 h-36"
                />
              </div>
              <p className="text-xs font-bold text-gray-800">Scan QR using GPay, PhonePe, Paytm, or CRED</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                QR expires in <strong className="text-amber-600 font-mono">{formatCountdown(countdown)}</strong>
              </p>

              <div className="w-full mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl">
                <span>VPA: <strong className="font-mono text-gray-700">bookmyshow@razorpay</strong></span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: CARDS */}
          {activeTab === 'card' && (
            <div className="space-y-3 py-1 animate-fade-in text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  readOnly
                  value="4242 •••• •••• 4242"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Expiry</label>
                  <input
                    type="text"
                    readOnly
                    value="12 / 28"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">CVV</label>
                  <input
                    type="password"
                    readOnly
                    value="•••"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-800"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                PCI-DSS Level 1 Compliant Card Vault
              </p>
            </div>
          )}

          {/* TAB 3: NETBANKING */}
          {activeTab === 'netbanking' && (
            <div className="grid grid-cols-2 gap-2 py-1 animate-fade-in text-xs">
              {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra'].map(bank => (
                <div key={bank} className="p-2.5 border border-gray-200 rounded-xl hover:border-[#F84464] cursor-pointer flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-700">{bank}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Action Button */}
        <div className="p-6 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Click to confirm simulated transaction
          </div>

          <button
            onClick={handlePay}
            disabled={processing}
            className="px-6 py-3 bg-[#F84464] hover:bg-[#d63a56] text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authorizing ₹{totalAmount}...</span>
              </>
            ) : (
              <>
                <span>Pay ₹{totalAmount}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
