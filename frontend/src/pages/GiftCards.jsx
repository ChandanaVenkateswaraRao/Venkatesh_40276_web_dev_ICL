import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Gift, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Printer, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  Heart, 
  Cake, 
  Film, 
  Info,
  Wallet,
  Lock,
  History,
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

const cardThemes = [
  {
    id: 'cinema',
    name: 'Cinema Lover',
    icon: Film,
    bgClass: 'bg-gradient-to-tr from-[#E50914] via-[#B81D24] to-[#221F1F]',
    textColor: 'text-white',
    badge: 'Popular'
  },
  {
    id: 'birthday',
    name: 'Happy Birthday',
    icon: Cake,
    bgClass: 'bg-gradient-to-tr from-[#8E2DE2] via-[#4A00E0] to-[#1F1C2C]',
    textColor: 'text-white',
    badge: 'Celebration'
  },
  {
    id: 'anniversary',
    name: 'Anniversary & Love',
    icon: Heart,
    bgClass: 'bg-gradient-to-tr from-[#FF416C] via-[#FF4B2B] to-[#990000]',
    textColor: 'text-white',
    badge: 'Romance'
  },
  {
    id: 'festival',
    name: 'Festive & Diwali',
    icon: Sparkles,
    bgClass: 'bg-gradient-to-tr from-[#F7971E] via-[#FFD200] to-[#BF5700]',
    textColor: 'text-gray-900',
    badge: 'Festive'
  },
  {
    id: 'celebration',
    name: 'Celebration & Cheers',
    icon: Sparkles,
    bgClass: 'bg-gradient-to-tr from-[#141E30] via-[#243B55] to-[#0F2027]',
    textColor: 'text-white',
    badge: 'Special'
  }
];

const presetAmounts = [1, 250, 500, 1000, 2000, 5000];

const GiftCards = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' | 'redeem' | 'balance'
  const [selectedTheme, setSelectedTheme] = useState(cardThemes[0]);
  const [denomination, setDenomination] = useState(1);
  const [customAmount, setCustomAmount] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Form fields for purchase
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [giftMessage, setGiftMessage] = useState('Enjoy the movies and entertainment on me! 🍿');

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

  const token = localStorage.getItem('token');

  // Fetch current user wallet balance and activity
  const fetchWallet = async () => {
    if (!token) return;
    setIsLoadingWallet(true);
    try {
      const res = await axios.get('http://localhost:5000/api/wallet/balance', {
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
      const orderRes = await axios.post('http://localhost:5000/api/giftcards/orders', {
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
        description: `${selectedTheme.name} Voucher (₹${currentAmount} x ${quantity})`,
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
            const verifyRes = await axios.post('http://localhost:5000/api/giftcards/verify', verifyPayload, { headers });

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
        'http://localhost:5000/api/giftcards/redeem',
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
        // Clear any previous balance result so UI focuses on success
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
      const res = await axios.post('http://localhost:5000/api/giftcards/check-balance', {
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-800 pb-20">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#1A1C2A] via-[#2F2C47] to-[#1A1C2A] text-white py-12 px-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F84464]/20 border border-[#F84464]/30 text-pink-300 text-xs font-semibold mb-3">
                <Gift className="w-3.5 h-3.5 text-[#F84464]" />
                Digital Entertainment Vouchers & BMS Wallet
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">
                Gift The Joy Of <span className="text-[#F84464]">Movies & Shows</span>
              </h1>

              <p className="text-gray-300 text-xs sm:text-sm max-w-xl">
                Instant Razorpay e-gift vouchers delivered immediately. Redeem directly to your BookMyShow wallet for instant 1-click ticket checkout!
              </p>
            </div>

            {/* LIVE WALLET BALANCE CARD */}
            {token ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl min-w-[280px]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F84464] flex items-center justify-center text-white shadow-md">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">BookMyShow Wallet</span>
                  </div>
                  <button
                    onClick={fetchWallet}
                    disabled={isLoadingWallet}
                    title="Refresh Balance"
                    className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWallet ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-white">₹{walletBalance.toLocaleString()}</span>
                  <span className="text-[11px] text-emerald-400 font-semibold ml-2">Available Cash</span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <button
                    onClick={() => { setActiveTab('redeem'); setRedeemSuccess(null); }}
                    className="text-pink-300 hover:text-pink-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>+ Add Money / Redeem</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  {walletTransactions.length > 0 && (
                    <button
                      onClick={() => setShowWalletHistory(!showWalletHistory)}
                      className="text-gray-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
                    >
                      <History className="w-3 h-3" />
                      <span>{showWalletHistory ? 'Hide' : 'History'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-5 text-center min-w-[260px]">
                <Wallet className="w-8 h-8 text-[#F84464] mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">BookMyShow Wallet</h4>
                <p className="text-[11px] text-gray-300 mt-1 mb-3">Login to redeem vouchers directly into your wallet</p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#F84464] hover:bg-[#d63a56] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Log In to View Wallet
                </button>
              </div>
            )}

          </div>

          {/* WALLET TRANSACTIONS MODAL / ACCORDION */}
          {token && showWalletHistory && walletTransactions.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 mb-6 animate-fade-in text-xs max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-pink-400" /> Recent Wallet Activity
                </span>
                <span className="text-[11px] text-gray-400">{walletTransactions.length} transaction(s)</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {walletTransactions.map((tx) => (
                  <div key={tx._id} className="bg-slate-800/80 p-2.5 rounded-xl flex justify-between items-center border border-slate-700/60">
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
                      <p className="text-[9px] text-gray-400">Bal: ₹{tx.balanceAfter}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="inline-flex p-1.5 bg-gray-900/90 rounded-2xl border border-gray-700 flex-wrap gap-1">
            <button
              onClick={() => { setActiveTab('buy'); setPurchasedCard(null); }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'buy'
                  ? 'bg-[#F84464] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Buy E-Gift Cards</span>
            </button>

            <button
              onClick={() => { setActiveTab('redeem'); setRedeemSuccess(null); }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'redeem'
                  ? 'bg-[#F84464] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Redeem to Wallet</span>
              {walletBalance > 0 && (
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                  ₹{walletBalance}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('balance')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'balance'
                  ? 'bg-[#F84464] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Card Balance</span>
            </button>
          </div>

        </div>
      </div>

      {/* TAB 1: BUY E-GIFT CARDS WITH RAZORPAY */}
      {activeTab === 'buy' && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          {purchasedCard ? (
            /* Purchase Success State */
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-200 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                Gift Card Purchased Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-6">
                Your payment was verified via Razorpay! An e-gift voucher has been generated for <strong>{purchasedCard.recipientEmail || 'you'}</strong>.
              </p>

              {/* Generated Visual Card Stub */}
              <div className={`p-6 sm:p-8 rounded-3xl ${purchasedCard.theme?.bgClass || 'bg-gradient-to-tr from-[#E50914] via-[#B81D24] to-[#221F1F]'} text-white shadow-2xl text-left relative overflow-hidden mb-8 border border-white/20`}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <img 
                      src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
                      alt="BookMyShow" 
                      className="h-6 w-auto filter brightness-200" 
                    />
                    <p className="text-[10px] tracking-widest uppercase opacity-80 mt-1">E-Gift Voucher</p>
                  </div>
                  <span className="text-3xl font-black text-white">₹{purchasedCard.amount}</span>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-wider text-gray-200 font-semibold">16-Digit Card Number</p>
                  <p className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white">
                    {purchasedCard.cardNumber}
                  </p>
                </div>

                <div className="flex justify-between items-end border-t border-white/20 pt-4 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-gray-200 font-semibold">Security PIN</p>
                    <p className="font-mono font-bold text-lg text-yellow-300">{purchasedCard.pin}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-200 font-semibold">Recipient</p>
                    <p className="font-bold">{purchasedCard.recipientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-gray-200 font-semibold">Validity</p>
                    <p className="font-bold">12 Months</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => handleCopyText(`${purchasedCard.cardNumber} (PIN: ${purchasedCard.pin})`, 'card')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'card' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'card' ? 'Copied Details!' : 'Copy Card & PIN'}</span>
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
                  className="bg-[#F84464] hover:bg-[#d63a56] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Buy Another Gift Card
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Live Card Preview & Theme Selection */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                    Live Gift Card Preview
                  </span>
                  
                  {/* Dynamic Graphic Card */}
                  <div className={`p-6 sm:p-7 rounded-3xl ${selectedTheme.bgClass} ${selectedTheme.textColor} shadow-2xl relative overflow-hidden transition-all duration-300 min-h-[230px] flex flex-col justify-between border border-white/10`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <img 
                          src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
                          alt="BookMyShow" 
                          className="h-6 w-auto filter brightness-200" 
                        />
                        <span className="text-[10px] tracking-widest uppercase opacity-80 block mt-1">
                          Official E-Gift Card
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black">
                          ₹{currentAmount.toLocaleString()}
                        </span>
                        <span className="text-[10px] block opacity-80">12 Months Validity</span>
                      </div>
                    </div>

                    <div className="my-4">
                      <p className="text-[11px] opacity-75 uppercase tracking-wider">For</p>
                      <p className="text-lg font-extrabold truncate">
                        {recipientName.trim() || 'Lucky Recipient'}
                      </p>
                      <p className="text-xs italic opacity-85 mt-1 line-clamp-1">
                        "{giftMessage}"
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/20 pt-3 text-[11px]">
                      <span>Theme: <strong>{selectedTheme.name}</strong></span>
                      <span className="font-mono opacity-90">6014 •••• •••• 9821</span>
                    </div>
                  </div>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                    Select Card Occasion / Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {cardThemes.map((theme) => {
                      const Icon = theme.icon;
                      const isSelected = selectedTheme.id === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected 
                              ? 'border-[#F84464] bg-red-50 text-[#F84464] shadow-xs' 
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-2" />
                          <span className="text-xs font-bold leading-tight">{theme.name}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">{theme.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Customization & Purchase Form */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-gray-200">
                <form onSubmit={handlePurchase} className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                      Select Denomination Amount (₹)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                      {presetAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setDenomination(amt);
                            setCustomAmount('');
                          }}
                          className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            denomination === amt && !customAmount
                              ? 'bg-[#F84464] text-white border-[#F84464] shadow-xs'
                              : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">Or Custom Amount:</span>
                      <input 
                        type="number"
                        min="1"
                        max="25000"
                        placeholder="₹ Custom amount (Min ₹1)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-xs font-bold text-gray-700">Number of Gift Cards</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 bg-white rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-sm font-black text-gray-900 w-4 text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        className="w-7 h-7 bg-white rounded-lg border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Recipient Name *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Priya Sharma"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Recipient Email Address *
                      </label>
                      <input 
                        type="email" 
                        required
                        placeholder="priya@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Sender Name *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Your Name"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Personal Gift Message
                      </label>
                      <input 
                        type="text" 
                        placeholder="Custom message on the voucher..."
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#F84464] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Summary & Checkout CTA */}
                  <div className="pt-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <span className="text-[11px] text-gray-400 block uppercase tracking-wider">Total Payable</span>
                      <p className="text-2xl font-black text-gray-900">
                        ₹{totalPayable.toLocaleString()}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing || totalPayable <= 0}
                      className="bg-[#F84464] hover:bg-[#d63a56] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-pink-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Opening Razorpay...</span>
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
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 text-[#F84464] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Wallet className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Redeem Gift Card to Wallet</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Enter your 16-digit voucher number and 4-digit PIN. The full voucher balance will be credited directly to your BookMyShow wallet for movie ticket bookings!
              </p>
            </div>

            {/* Current Wallet Balance Banner */}
            {token ? (
              <div className="bg-gradient-to-r from-slate-900 to-[#1F2533] text-white p-4 rounded-2xl mb-6 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-[#F84464]">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold block">Current Wallet Balance</span>
                    <span className="text-2xl font-black text-white">₹{walletBalance.toLocaleString()}</span>
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
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Please sign in to your BookMyShow account to credit money into your wallet.</span>
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
              <div className="mb-6 p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center animate-fade-in shadow-sm">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-emerald-900">
                  {redeemSuccess.message}
                </h3>
                <div className="mt-4 p-3 bg-white/80 rounded-xl border border-emerald-200 flex justify-around text-xs">
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold block">Credited Amount</span>
                    <span className="text-base font-black text-emerald-600">+₹{redeemSuccess.creditedAmount}</span>
                  </div>
                  <div className="border-r border-emerald-200"></div>
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold block">New Wallet Balance</span>
                    <span className="text-base font-black text-gray-900">₹{redeemSuccess.walletBalance}</span>
                  </div>
                </div>

                <div className="mt-5 flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[#F84464] hover:bg-[#d63a56] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
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
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{redeemError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={redeemLoading}
                className="w-full bg-[#F84464] hover:bg-[#d63a56] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-pink-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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
                Want to check voucher balance without adding to wallet?{' '}
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
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 text-[#F84464] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CreditCard className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Check Gift Card Balance</h2>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Enter your 16-digit BookMyShow Gift Card number and 4-digit PIN to check real-time balance and expiry.
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
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{balanceError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={balanceChecking}
                className="w-full bg-[#1A1C2A] hover:bg-gray-800 text-white py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
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
              <div className="mt-8 p-6 bg-green-50/80 border border-green-200 rounded-2xl animate-fade-in text-center shadow-xs">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                  balanceResult.isRedeemed 
                    ? 'bg-amber-100 text-amber-800' 
                    : balanceResult.isExpired 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {balanceResult.status}
                </span>

                <p className="text-xs text-gray-500 mt-3 mb-1">Available Gift Card Balance</p>
                <p className="text-4xl font-black text-green-700">₹{balanceResult.balance.toLocaleString()}</p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-green-200 text-xs text-left">
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold">Card Number</span>
                    <p className="font-mono font-bold text-gray-800 break-all">{balanceResult.cardNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] uppercase font-bold">Validity Date</span>
                    <p className="font-bold text-gray-800">{balanceResult.validTill}</p>
                  </div>
                </div>

                {/* Instant Redeem Button if card has active balance */}
                {!balanceResult.isRedeemed && !balanceResult.isExpired && balanceResult.balance > 0 && (
                  <div className="mt-6 pt-4 border-t border-green-200">
                    <button
                      type="button"
                      onClick={() => handleRedeemGiftCard(null, balanceResult.cardNumber, balanceCardPin)}
                      disabled={redeemLoading}
                      className="w-full bg-[#F84464] hover:bg-[#d63a56] text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>⚡ Redeem ₹{balanceResult.balance.toLocaleString()} to My Wallet</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gift Card Benefits Banner */}
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F84464]">Why Choose BookMyShow Gift Cards</span>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              The Perfect Entertainment Present
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#F84464] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">12-Month Validity</h4>
                <p className="text-xs text-gray-500">Recipients have a full 365 days from date of purchase to redeem and book any movie or event.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">Redeem Across All Cinemas</h4>
                <p className="text-xs text-gray-500">Valid across 5,000+ screens including PVR, INOX, Cinepolis, and IMAX theaters nationwide.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-1">Instant Wallet Credit</h4>
                <p className="text-xs text-gray-500">Add the voucher directly into your BookMyShow wallet and enjoy zero-fee instant checkout anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default GiftCards;
