import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { 
  Gift, 
  CreditCard, 
  CheckCircle2, 
  Copy, 
  Check, 
  Printer, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  Film, 
  Info,
  Wallet,
  Lock,
  History,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Award,
  RotateCw,
  Building2,
  Barcode,
  QrCode,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Mail,
  Phone
} from 'lucide-react';

const cardThemes = [
  {
    id: 'cinema-signature',
    name: 'Cinema Signature',
    edition: 'Premiere Edition',
    icon: Film,
    cardBg: 'from-[#140608] via-[#240A0F] to-[#120406]',
    borderStyle: 'border-rose-900/50',
    accentColor: '#F84464',
    badgeText: 'Bestseller',
    foilColor: 'text-rose-400',
    chipTone: 'gold',
    watermark: 'CINEMA EXCLUSIVE'
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold Club',
    edition: 'VIP Access',
    icon: Award,
    cardBg: 'from-[#0E1015] via-[#1B1914] to-[#0A0C0F]',
    borderStyle: 'border-amber-700/50',
    accentColor: '#E5C07B',
    badgeText: 'VIP Club',
    foilColor: 'text-amber-300',
    chipTone: 'gold',
    watermark: 'GOLD PREMIERE'
  },
  {
    id: 'platinum-executive',
    name: 'Platinum Titanium',
    edition: 'Corporate All-Access',
    icon: ShieldCheck,
    cardBg: 'from-[#16181F] via-[#242834] to-[#12141A]',
    borderStyle: 'border-slate-500/50',
    accentColor: '#94A3B8',
    badgeText: 'Executive',
    foilColor: 'text-slate-200',
    chipTone: 'silver',
    watermark: 'TITANIUM PRIVILEGE'
  },
  {
    id: 'royal-sapphire',
    name: 'Royal Sapphire',
    edition: 'Celebration Edition',
    icon: Sparkles,
    cardBg: 'from-[#0A0F1D] via-[#111C38] to-[#080B14]',
    borderStyle: 'border-blue-700/50',
    accentColor: '#60A5FA',
    badgeText: 'Celebration',
    foilColor: 'text-blue-300',
    chipTone: 'silver',
    watermark: 'ROYAL CELEBRATION'
  },
  {
    id: 'imperial-crimson',
    name: 'Imperial Burgundy',
    edition: 'Special Occasion',
    icon: Gift,
    cardBg: 'from-[#1E0611] via-[#380D21] to-[#16040C]',
    borderStyle: 'border-pink-900/50',
    accentColor: '#F472B6',
    badgeText: 'Festive',
    foilColor: 'text-pink-300',
    chipTone: 'gold',
    watermark: 'PRESTIGE GIFT'
  }
];

const presetAmounts = [250, 500, 1000, 2000, 5000];

const messagePresets = [
  'Enjoy the movies and entertainment on BookMyShow.',
  'Wishing you a cinematic experience like never before.',
  'Celebrate the moment with blockbusters and popcorn on me.',
  'A special cinema treat for an extraordinary person.'
];

const faqs = [
  {
    q: 'Where can I redeem my BookMyShow Gift Card?',
    a: 'BookMyShow Gift Cards are accepted across 5,000+ screens nationwide, including PVR, INOX, Cinepolis, Miraj, and standalone cinemas, as well as for events, plays, sports tickets, and online food & beverage orders.'
  },
  {
    q: 'Can a gift card be redeemed multiple times?',
    a: 'Yes. If your total ticket transaction is less than the gift card balance, the remaining amount remains safe on your card for future bookings until the 12-month validity expires.'
  },
  {
    q: 'How does redeeming to BookMyShow Wallet work?',
    a: 'Simply enter the 16-digit card number and 4-digit PIN in the "Redeem to Wallet" tab. The entire face value is immediately credited to your BookMyShow cash wallet with zero deduction fees.'
  },
  {
    q: 'What if the ticket price is greater than the gift card value?',
    a: 'During checkout, your gift card or wallet balance will deduct first, and any remaining balance can be settled smoothly using UPI, Credit/Debit card, or Net Banking.'
  }
];

const GiftCards = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' | 'redeem' | 'balance'
  const [selectedTheme, setSelectedTheme] = useState(cardThemes[0]);
  const [denomination, setDenomination] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Form fields for purchase
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [giftMessage, setGiftMessage] = useState(messagePresets[0]);

  // Checkout & Generated card state
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchasedCard, setPurchasedCard] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [showWalletHistory, setShowWalletHistory] = useState(false);

  // Redeem State
  const [redeemCardNumber, setRedeemCardNumber] = useState('');
  const [redeemCardPin, setRedeemCardPin] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(null);
  const [redeemError, setRedeemError] = useState('');

  // Balance Check State
  const [balanceCardNumber, setBalanceCardNumber] = useState('');
  const [balanceCardPin, setBalanceCardPin] = useState('');
  const [balanceResult, setBalanceResult] = useState(null);
  const [balanceChecking, setBalanceChecking] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  const token = localStorage.getItem('token');

  // Fetch current user wallet balance and activity
  const fetchWallet = async () => {
    if (!token) return;
    setIsLoadingWallet(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWalletBalance(res.data.walletBalance || 0);
        setWalletTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.warn('Failed to fetch wallet info:', err);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [token]);

  const currentAmount = customAmount ? parseInt(customAmount) || 0 : denomination;
  const totalPayable = currentAmount * quantity;

  // Real-Time Razorpay Checkout for Gift Card Purchase
  const handlePurchase = async (e) => {
    e.preventDefault();
    if (totalPayable <= 0) return;

    setIsProcessing(true);

    // 1. Ensure Razorpay Checkout SDK is ready
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      await new Promise(resolve => {
        script.onload = resolve;
      });
    }

    try {
      // 2. Create Razorpay Order on Backend
      const orderRes = await axios.post(`${API_BASE_URL}/giftcards/orders`, {
        amount: currentAmount,
        quantity
      });
      const order = orderRes.data.data;

      // 3. Initiate Razorpay Modal
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SZW126jzeHpLC8';
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'BookMyShow Gift Cards',
        description: `${selectedTheme.name} Voucher (INR ${currentAmount} x ${quantity})`,
        image: 'https://in.bmscdn.com/webin/common/icons/logo.svg',
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: currentAmount,
              quantity,
              theme: selectedTheme,
              recipientName: recipientName || 'Valued Customer',
              recipientEmail: recipientEmail || '',
              senderName: senderName || 'A Well-Wisher',
              message: giftMessage
            };

            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const verifyRes = await axios.post(`${API_BASE_URL}/giftcards/verify`, verifyPayload, { headers });

            if (verifyRes.data.success) {
              const newCard = verifyRes.data.giftCard;
              setPurchasedCard(newCard);

              // Cache to localStorage for offline reference in profile
              const stored = JSON.parse(localStorage.getItem('bms_gift_cards') || '[]');
              stored.unshift(newCard);
              localStorage.setItem('bms_gift_cards', JSON.stringify(stored));
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            alert(err.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: senderName || '',
          email: recipientEmail || ''
        },
        theme: {
          color: '#F84464'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setIsProcessing(false);
        alert(`Payment Failed: ${resp.error.description}`);
      });
      rzp.open();
    } catch (err) {
      console.error('Failed to initiate Razorpay checkout:', err);
      setIsProcessing(false);
      alert(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
    }
  };

  // Redeem Gift Card to User's Wallet
  const handleRedeemGiftCard = async (e, directCardNum, directPin) => {
    if (e) e.preventDefault();

    if (!token) {
      alert('Please log in to your account to redeem gift cards into your wallet balance.');
      navigate('/login');
      return;
    }

    const numToRedeem = directCardNum || redeemCardNumber;
    const pinToRedeem = directPin || redeemCardPin;

    if (!numToRedeem || numToRedeem.replace(/\s+/g, '').length < 8) {
      setRedeemError('Please enter a valid 16-digit Gift Card number.');
      return;
    }

    if (!pinToRedeem || pinToRedeem.trim().length !== 4) {
      setRedeemError('Please enter your 4-digit security PIN.');
      return;
    }

    setRedeemLoading(true);
    setRedeemError('');
    setRedeemSuccess(null);

    try {
      // Check if card has amount from local storage
      let voucherAmount = undefined;
      try {
        const stored = JSON.parse(localStorage.getItem('bms_gift_cards') || '[]');
        const localMatch = stored.find(c => c.cardNumber?.replace(/\s+/g, '') === numToRedeem.replace(/\s+/g, ''));
        if (localMatch && localMatch.amount) {
          voucherAmount = localMatch.amount;
        }
      } catch (e) {
        // ignore
      }

      const res = await axios.post(
        `${API_BASE_URL}/giftcards/redeem`,
        {
          cardNumber: numToRedeem,
          pin: pinToRedeem,
          amount: voucherAmount
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        setRedeemSuccess(res.data);
        setWalletBalance(res.data.walletBalance);
        setRedeemCardNumber('');
        setRedeemCardPin('');
        fetchWallet();
        if (balanceResult) setBalanceResult(null);
      }
    } catch (err) {
      setRedeemError(err.response?.data?.message || 'Failed to redeem gift card. Please check the card details.');
    } finally {
      setRedeemLoading(false);
    }
  };

  // Check Card Balance
  const handleCheckBalance = async (e) => {
    e.preventDefault();
    setBalanceChecking(true);
    setBalanceError('');
    setBalanceResult(null);

    const cleanInput = balanceCardNumber.replace(/\s+/g, '');
    if (cleanInput.length < 8) {
      setBalanceError('Please enter a valid 16-digit card number.');
      setBalanceChecking(false);
      return;
    }

    if (balanceCardPin.trim().length !== 4) {
      setBalanceError('Please enter a 4-digit security PIN.');
      setBalanceChecking(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/giftcards/check-balance`, {
        cardNumber: balanceCardNumber,
        pin: balanceCardPin
      });

      if (res.data.success) {
        setBalanceResult(res.data);
      }
    } catch (err) {
      // Fallback check in localStorage if offline
      const stored = JSON.parse(localStorage.getItem('bms_gift_cards') || '[]');
      const match = stored.find(
        c => c.cardNumber.replace(/\s+/g, '') === cleanInput && c.pin === balanceCardPin.trim()
      );

      if (match) {
        setBalanceResult({
          cardNumber: match.cardNumber,
          balance: match.amount,
          status: 'Active & Verified',
          validTill: match.validTill || '31 Dec 2027',
          themeName: match.theme?.name || 'BookMyShow Gift Card'
        });
      } else {
        setBalanceError(err.response?.data?.message || 'Invalid Gift Card number or 4-digit PIN. Please verify details.');
      }
    } finally {
      setBalanceChecking(false);
    }
  };

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  // Realistic Physical/Digital Gift Card Component
  const renderCardVisual = (cardData, isFlipped, onToggleFlip) => {
    const theme = cardData.theme || selectedTheme;
    const amountVal = cardData.amount || currentAmount;
    const cardNum = cardData.cardNumber || '6014 9821 4452 7891';
    const pinVal = cardData.pin || '••••';
    const recipient = cardData.recipientName || recipientName.trim() || 'VALUED GUEST';
    const message = cardData.message || giftMessage;
    const validTill = cardData.validTill || '12 MONTHS FROM ISSUE';

    return (
      <div className="relative group perspective-1000">
        <div 
          className={`w-full aspect-[1.586/1] min-h-[230px] rounded-2xl sm:rounded-3xl p-6 sm:p-7 relative overflow-hidden text-white shadow-2xl border transition-all duration-500 bg-gradient-to-br ${theme.cardBg} ${theme.borderStyle}`}
          style={{
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* Subtle Metallic Micro-Texture & Watermark */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -right-8 -bottom-8 select-none pointer-events-none opacity-5 font-black text-6xl tracking-widest text-white uppercase transform rotate-[-12deg]">
            {theme.watermark || 'BOOKMYSHOW'}
          </div>

          {!isFlipped ? (
            /* FRONT OF CARD */
            <div className="relative z-10 h-full flex flex-col justify-between">
              {/* Header: Official Logo & Balance */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#F84464] flex items-center justify-center font-black text-white text-xs tracking-tight shadow-md border border-white/20">
                    BMS
                  </div>
                  <div>
                    <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                      book<span className="text-[#F84464]">my</span>show
                    </span>
                    <span className="text-[8px] tracking-[0.25em] uppercase text-gray-300 font-semibold block mt-0.5">
                      {theme.edition}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className="text-xs text-gray-400 font-medium">INR</span>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                      {amountVal.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                    Prepaid Balance
                  </span>
                </div>
              </div>

              {/* Middle: EMV Smart Chip & Contactless Waves */}
              <div className="flex items-center justify-between my-2">
                <div className="flex items-center gap-3">
                  {/* EMV Microchip */}
                  <div className={`w-11 h-8 rounded-md p-1 border shadow-inner flex flex-col justify-between relative overflow-hidden ${
                    theme.chipTone === 'silver'
                      ? 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 border-slate-400/50'
                      : 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border-amber-500/50'
                  }`}>
                    <div className="w-full h-[1px] bg-black/30 my-auto"></div>
                    <div className="w-full h-[1px] bg-black/30 my-auto"></div>
                    <div className="absolute inset-y-0 left-1/3 w-[1px] bg-black/30"></div>
                    <div className="absolute inset-y-0 right-1/3 w-[1px] bg-black/30"></div>
                    <div className="absolute inset-1 rounded-sm border border-black/20"></div>
                  </div>

                  {/* Contactless Waves Icon */}
                  <svg className="w-5 h-5 text-gray-400/70 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                    <path d="M12 19a8.5 8.5 0 0 1 0-14" />
                    <path d="M15.5 21.5a12 12 0 0 1 0-19" />
                  </svg>
                </div>

                {/* Foil Badge */}
                <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-gray-300 font-semibold backdrop-blur-xs">
                  {theme.badgeText}
                </div>
              </div>

              {/* 16-Digit Voucher Code (Embossed Monospace) */}
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-1">
                  Card Number
                </p>
                <p className="font-mono text-base sm:text-xl font-bold tracking-[0.22em] text-white drop-shadow-sm truncate">
                  {cardNum}
                </p>
              </div>

              {/* Bottom Row: Recipient, Expiry & Hologram */}
              <div className="flex items-end justify-between pt-2 border-t border-white/10 text-[10px]">
                <div className="max-w-[50%]">
                  <span className="text-[8px] uppercase tracking-wider text-gray-400 block font-semibold">
                    Recipient
                  </span>
                  <span className="font-bold uppercase tracking-wider truncate block text-white">
                    {recipient}
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[8px] uppercase tracking-wider text-gray-400 block font-semibold">
                    Valid Thru
                  </span>
                  <span className="font-mono font-bold text-gray-200">
                    {validTill}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[8px] uppercase tracking-wider text-gray-400 block font-semibold">
                    Security PIN
                  </span>
                  <span className="font-mono font-bold text-amber-300 tracking-wider">
                    {pinVal}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* BACK OF CARD */
            <div className="relative z-10 h-full flex flex-col justify-between -mx-6 sm:-mx-7 -my-6 sm:-my-7 p-6 sm:p-7">
              {/* Magnetic Stripe */}
              <div className="-mx-6 sm:-mx-7 -mt-6 sm:-mt-7 h-10 bg-[#08080A] border-y border-white/10 flex items-center px-6">
                <span className="text-[9px] tracking-widest font-mono text-gray-600 uppercase">
                  MAGNETIC STRIPE - NON RELOADABLE PREPAID VOUCHER
                </span>
              </div>

              {/* Signature Strip & PIN Panel */}
              <div className="my-3">
                <div className="flex items-center justify-between bg-neutral-100 rounded-md p-2 text-neutral-900 border border-neutral-300">
                  <div className="text-[9px] italic text-neutral-500 font-mono">
                    Authorized Recipient Signature Panel
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-neutral-600 uppercase">CVV / PIN:</span>
                    <span className="font-mono font-black text-sm bg-neutral-900 text-amber-400 px-2.5 py-0.5 rounded tracking-widest">
                      {pinVal}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 italic line-clamp-1">
                  "{message}"
                </p>
              </div>

              {/* Barcode & Legal Disclaimer */}
              <div className="flex items-end justify-between pt-2 border-t border-white/10">
                <div className="max-w-[70%]">
                  <p className="text-[8px] text-gray-400 leading-tight">
                    Issued by BookMyShow under Prepaid Payment Instrument guidelines. Valid for cinema ticket booking, theatre, events, and concession counters across India.
                  </p>
                  <p className="text-[8px] text-gray-400 mt-1">
                    Customer Helpline: 022-61445050 | help@bookmyshow.com
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <Barcode className="w-20 h-6 text-gray-300 opacity-90" />
                  <span className="font-mono text-[8px] text-gray-400 tracking-wider">
                    {cardNum.replace(/\s+/g, '').slice(-8)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Flip Card Action Button */}
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={onToggleFlip}
            className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-gray-100"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isFlipped ? 'View Front Side' : 'View Back & PIN Panel'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-gray-800 pb-20">
      
      {/* Top Navigation / Breadcrumb Header */}
      <div className="bg-[#1A1C24] text-white py-10 px-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F84464]" />
                BookMyShow Official E-Gift Vouchers & Cash Wallet
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white">
                Gift Entertainment, <span className="text-[#F84464]">Instantly</span>
              </h1>

              <p className="text-gray-400 text-xs sm:text-sm max-w-xl leading-relaxed">
                Send official digital movie vouchers with zero convenience fees. Redeemable across 5,000+ screens nationwide or credited directly into your BookMyShow Cash Wallet.
              </p>
            </div>

            {/* LIVE WALLET BALANCE CARD */}
            {token ? (
              <div className="bg-[#222533] border border-gray-700/60 rounded-2xl p-5 sm:p-6 shadow-xl min-w-[280px]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F84464] flex items-center justify-center text-white shadow-sm">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">BookMyShow Wallet</span>
                  </div>
                  <button
                    onClick={fetchWallet}
                    disabled={isLoadingWallet}
                    title="Refresh Balance"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWallet ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                    ₹{walletBalance.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold ml-2">Available Balance</span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs">
                  <button
                    onClick={() => { setActiveTab('redeem'); setRedeemSuccess(null); }}
                    className="text-[#F84464] hover:text-pink-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>+ Redeem Gift Card</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  {walletTransactions.length > 0 && (
                    <button
                      onClick={() => setShowWalletHistory(!showWalletHistory)}
                      className="text-gray-400 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                    >
                      <History className="w-3 h-3" />
                      <span>{showWalletHistory ? 'Hide' : 'Transactions'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#222533] border border-gray-700/60 rounded-2xl p-5 text-center min-w-[260px]">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2 text-[#F84464]">
                  <Wallet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">BookMyShow Wallet</h4>
                <p className="text-[11px] text-gray-400 mt-1 mb-3">Sign in to redeem vouchers directly to your cash wallet</p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#F84464] hover:bg-[#e03554] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Log In to View Wallet
                </button>
              </div>
            )}

          </div>

          {/* WALLET TRANSACTIONS ACCORDION */}
          {token && showWalletHistory && walletTransactions.length > 0 && (
            <div className="bg-[#151720] border border-gray-800 rounded-2xl p-4 mb-6 text-xs max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#F84464]" /> Recent Wallet Activity
                </span>
                <span className="text-[11px] text-gray-400">{walletTransactions.length} transaction(s)</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {walletTransactions.map((tx) => (
                  <div key={tx._id} className="bg-[#1F222E] p-2.5 rounded-xl flex justify-between items-center border border-gray-800">
                    <div>
                      <p className="font-semibold text-white text-xs">{tx.description}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold text-sm ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'CREDIT' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                      </span>
                      <p className="text-[9px] text-gray-400">Balance: ₹{tx.balanceAfter}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="inline-flex p-1.5 bg-[#12131A] rounded-xl border border-gray-800 flex-wrap gap-1">
            <button
              onClick={() => { setActiveTab('buy'); setPurchasedCard(null); }}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'buy'
                  ? 'bg-[#F84464] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Buy E-Gift Cards</span>
            </button>

            <button
              onClick={() => { setActiveTab('redeem'); setRedeemSuccess(null); }}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'redeem'
                  ? 'bg-[#F84464] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Redeem to Wallet</span>
              {walletBalance > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                  ₹{walletBalance}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('balance')}
              className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'balance'
                  ? 'bg-[#F84464] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Check Voucher Balance</span>
            </button>
          </div>

        </div>
      </div>

      {/* TAB 1: BUY E-GIFT CARDS */}
      {activeTab === 'buy' && (
        <div className="max-w-6xl mx-auto px-4 py-10">
          {purchasedCard ? (
            /* Purchase Success Confirmation */
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-gray-200 text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                Gift Card Issued Successfully
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Payment verified via Razorpay. Your 16-digit voucher and security PIN have been generated and dispatched to <strong>{purchasedCard.recipientEmail || 'your email'}</strong>.
              </p>

              {/* Generated Visual Card Representation */}
              <div className="mb-6 text-left">
                {renderCardVisual(purchasedCard, isCardFlipped, () => setIsCardFlipped(!isCardFlipped))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => handleCopyText(`${purchasedCard.cardNumber} (PIN: ${purchasedCard.pin})`, 'card')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'card' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'card' ? 'Details Copied' : 'Copy Card & PIN'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('redeem');
                    setRedeemCardNumber(purchasedCard.cardNumber);
                    setRedeemCardPin(purchasedCard.pin);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Redeem to My Wallet Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPurchasedCard(null);
                    setRecipientName('');
                    setRecipientEmail('');
                  }}
                  className="bg-[#F84464] hover:bg-[#e03554] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Purchase Another Card
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* Left Column: Live Card Preview & Theme Selection */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Live Voucher Preview
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Standard ISO ID-1 Format
                    </span>
                  </div>
                  
                  {/* Dynamic Realistic Card */}
                  {renderCardVisual(
                    {
                      theme: selectedTheme,
                      amount: currentAmount,
                      cardNumber: '6014 9821 4452 7891',
                      pin: '••••',
                      recipientName: recipientName.trim() || 'VALUED GUEST',
                      message: giftMessage,
                      validTill: '12 MONTHS'
                    },
                    isCardFlipped,
                    () => setIsCardFlipped(!isCardFlipped)
                  )}
                </div>

                {/* Theme Selector */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                    Select Card Finish & Occasion
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cardThemes.map((theme) => {
                      const Icon = theme.icon;
                      const isSelected = selectedTheme.id === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'border-[#F84464] bg-rose-50/50 shadow-xs ring-1 ring-[#F84464]' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${theme.cardBg} border ${theme.borderStyle}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-gray-900 block leading-tight">{theme.name}</span>
                              <span className="text-[10px] text-gray-500 mt-0.5 block">{theme.edition}</span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#F84464] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Security Guarantee Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-700">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">100% Secured Payments</span>
                    <span className="text-slate-500 text-[11px]">Authorized by RBI. Protected with 256-bit Razorpay bank-grade encryption.</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Customization & Purchase Form */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-gray-200">
                <form onSubmit={handlePurchase} className="space-y-6">
                  
                  {/* Amount Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Select Denomination Amount (INR)
                      </label>
                      <span className="text-[11px] text-gray-400">Min INR 100</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                      {presetAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setDenomination(amt);
                            setCustomAmount('');
                          }}
                          className={`py-2.5 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                            denomination === amt && !customAmount
                              ? 'bg-[#F84464] text-white border-[#F84464] shadow-xs'
                              : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          ₹{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">Or Custom Amount:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                        <input 
                          type="number"
                          min="1"
                          max="25000"
                          placeholder="Enter custom amount (e.g. 1500)"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Voucher Quantity</span>
                      <span className="text-[11px] text-gray-500">Number of individual digital vouchers</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 bg-white rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        -
                      </button>
                      <span className="text-sm font-black text-gray-900 w-4 text-center font-mono">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        className="w-8 h-8 bg-white rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Recipient Name *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Ananya Roy"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Recipient Email Address *
                      </label>
                      <input 
                        type="email" 
                        required
                        placeholder="recipient@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Sender Name *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Your full name"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Quick Message Templates
                      </label>
                      <select
                        onChange={(e) => setGiftMessage(e.target.value)}
                        value={giftMessage}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white text-gray-700"
                      >
                        {messagePresets.map((msg, i) => (
                          <option key={i} value={msg}>{msg.slice(0, 38)}...</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Personalized Gift Message (Appears on Card)
                      </label>
                      <input 
                        type="text" 
                        maxLength={90}
                        placeholder="Custom message on the voucher..."
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">Maximum 90 characters</span>
                    </div>
                  </div>

                  {/* Summary & Checkout CTA */}
                  <div className="pt-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <span className="text-[11px] text-gray-400 block uppercase tracking-wider font-semibold">Total Payable</span>
                      <p className="text-2xl font-black text-gray-900 font-mono">
                        ₹{totalPayable.toLocaleString()}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing || totalPayable <= 0}
                      className="bg-[#F84464] hover:bg-[#e03554] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Opening Secure Gateway...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pay with Razorpay (₹{totalPayable.toLocaleString()})</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 2: REDEEM GIFT CARD TO WALLET */}
      {activeTab === 'redeem' && (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#F84464] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Wallet className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Redeem Voucher to Wallet</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                Add your 16-digit voucher number and 4-digit PIN. The face value will be credited directly to your BookMyShow Cash Wallet for instant 1-click movie booking.
              </p>
            </div>

            {/* Current Wallet Balance Banner */}
            {token ? (
              <div className="bg-[#1F222E] text-white p-4 rounded-2xl mb-6 flex items-center justify-between border border-gray-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F84464]">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Current Wallet Balance</span>
                    <span className="text-2xl font-black text-white font-mono">₹{walletBalance.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchWallet}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingWallet ? 'animate-spin' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Please sign in to your BookMyShow account to credit money to your wallet.</span>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shrink-0 cursor-pointer transition-colors"
                >
                  Log In
                </button>
              </div>
            )}

            {/* Redeem Success Notification */}
            {redeemSuccess && (
              <div className="mb-6 p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-center animate-fade-in shadow-xs">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-emerald-900">
                  {redeemSuccess.message}
                </h3>
                <div className="mt-4 p-3 bg-white/80 rounded-xl border border-emerald-200 flex justify-around text-xs">
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold block">Credited Amount</span>
                    <span className="text-base font-black text-emerald-600 font-mono">+₹{redeemSuccess.creditedAmount}</span>
                  </div>
                  <div className="border-r border-emerald-200"></div>
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold block">Updated Wallet Cash</span>
                    <span className="text-base font-black text-gray-900 font-mono">₹{redeemSuccess.walletBalance}</span>
                  </div>
                </div>

                <div className="mt-5 flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[#F84464] hover:bg-[#e03554] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Book Movie Tickets Now
                  </button>
                  <button
                    onClick={() => setRedeemSuccess(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all"
                  >
                    Redeem Another Card
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={(e) => handleRedeemGiftCard(e)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  16-Digit Gift Card Number
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 6014 9821 4452 7891"
                  value={redeemCardNumber}
                  onChange={(e) => setRedeemCardNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-[#F84464] focus:bg-white tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  4-Digit Security PIN
                </label>
                <input 
                  type="password" 
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={redeemCardPin}
                  onChange={(e) => setRedeemCardPin(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-[#F84464] focus:bg-white tracking-widest text-center"
                />
              </div>

              {redeemError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{redeemError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={redeemLoading}
                className="w-full bg-[#F84464] hover:bg-[#e03554] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {redeemLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying & Crediting Wallet...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Redeem to BookMyShow Wallet</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <span className="text-xs text-gray-500">
                Want to check voucher balance without crediting to wallet?{' '}
                <button 
                  type="button" 
                  onClick={() => setActiveTab('balance')} 
                  className="text-[#F84464] font-bold hover:underline cursor-pointer"
                >
                  Check Card Balance
                </button>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHECK BALANCE */}
      {activeTab === 'balance' && (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#F84464] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CreditCard className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Check Gift Card Balance</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                Enter your 16-digit BookMyShow Gift Card number and 4-digit PIN to check real-time available balance and expiration date.
              </p>
            </div>

            <form onSubmit={handleCheckBalance} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  16-Digit Card Number
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 6014 9821 4452 7891"
                  value={balanceCardNumber}
                  onChange={(e) => setBalanceCardNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-[#F84464] focus:bg-white tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  4-Digit Security PIN
                </label>
                <input 
                  type="password" 
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={balanceCardPin}
                  onChange={(e) => setBalanceCardPin(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-[#F84464] focus:bg-white tracking-widest text-center"
                />
              </div>

              {balanceError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{balanceError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={balanceChecking}
                className="w-full bg-[#1A1C24] hover:bg-gray-800 text-white py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {balanceChecking ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Check Card Status & Balance</span>
                  </>
                )}
              </button>
            </form>

            {/* Balance Result Box */}
            {balanceResult && (
              <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in text-center shadow-xs">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  balanceResult.isRedeemed 
                    ? 'bg-amber-100 text-amber-800' 
                    : balanceResult.isExpired 
                    ? 'bg-rose-100 text-rose-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {balanceResult.status}
                </span>

                <p className="text-xs text-gray-500 mt-3 mb-1">Available Gift Card Balance</p>
                <p className="text-4xl font-black text-gray-900 font-mono">₹{balanceResult.balance.toLocaleString()}</p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200 text-xs text-left">
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold">Card Number</span>
                    <p className="font-mono font-bold text-gray-800 break-all">{balanceResult.cardNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold">Validity Date</span>
                    <p className="font-bold text-gray-800">{balanceResult.validTill}</p>
                  </div>
                </div>

                {/* Instant Redeem to Wallet Button */}
                {!balanceResult.isRedeemed && !balanceResult.isExpired && balanceResult.balance > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleRedeemGiftCard(null, balanceResult.cardNumber, balanceCardPin)}
                      disabled={redeemLoading}
                      className="w-full bg-[#F84464] hover:bg-[#e03554] text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Redeem ₹{balanceResult.balance.toLocaleString()} to My Wallet</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Corporate Gifting & Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-8">
        
        {/* Value Proposition Highlights */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F84464]">Official Assurance</span>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              Why Choose BookMyShow Entertainment Vouchers
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#F84464] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">12-Month Extended Validity</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Recipients enjoy a full 365 days from the issue date to redeem across any movie or live entertainment booking.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">5,000+ Cinema Screens</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Accepted across major multiplex chains including PVR INOX, Cinepolis, Miraj, and premier IMAX auditoriums nationwide.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">Instant Wallet Rollover</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Transfer the entire face value straight into your BookMyShow cash wallet for one-tap express checkout anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Corporate & Bulk Gifting Banner */}
        <div className="bg-[#1A1C24] text-white rounded-3xl p-8 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#F84464] shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F84464] block">Enterprise Rewards</span>
              <h4 className="text-lg font-bold text-white">Corporate Gifting & Bulk Orders</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-lg">
                Planning employee rewards, festive incentives, or client thank-you campaigns? Avail custom co-branded digital vouchers with bulk pricing and automated API delivery.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="mailto:corporatesales@bookmyshow.com?subject=Corporate%20Gift%20Cards%20Enquiry"
              className="bg-white hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Mail className="w-4 h-4 text-[#F84464]" />
              <span>Contact Corporate Desk</span>
            </a>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-[#F84464]" />
            <h3 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex justify-between items-center text-left text-xs sm:text-sm font-bold text-gray-800 hover:text-[#F84464] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <p className="text-xs text-gray-500 mt-2.5 leading-relaxed animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default GiftCards;
