import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Percent, 
  CreditCard, 
  Wallet, 
  Film, 
  Copy, 
  Check, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Coffee, 
  Gift, 
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

const offersData = [
  {
    id: 1,
    title: 'Buy 1 Get 1 Free on HDFC Bank Millennia Cards',
    code: 'HDFCBOGO',
    category: 'credit',
    bank: 'HDFC Bank',
    bankColor: 'bg-blue-600',
    discount: 'Buy 1 Get 1 FREE',
    tag: 'BOGO Offer',
    validTill: '31 Dec 2026',
    description: 'Get 1 complimentary ticket on purchase of 1 or more tickets using HDFC Bank Millennia Credit Card.',
    terms: [
      'Minimum booking of 2 tickets is required to avail this offer.',
      'Maximum discount capped at ₹250 per transaction.',
      'Offer is valid twice per calendar month per cardholder.',
      'Applicable on all 2D, 3D, and IMAX screenings across all partner cinemas.'
    ]
  },
  {
    id: 2,
    title: 'Up to ₹250 Off on ICICI Bank Coral & Rubyx Cards',
    code: 'ICICISPECIAL',
    category: 'credit',
    bank: 'ICICI Bank',
    bankColor: 'bg-orange-600',
    discount: '25% Instant Off',
    tag: 'Popular',
    validTill: '15 Nov 2026',
    description: 'Enjoy 25% instant discount up to ₹250 on minimum booking value of ₹400 with ICICI Bank Credit Cards.',
    terms: [
      'Valid on ICICI Bank Coral, Rubyx, and Sapphiro Credit Cards.',
      'Minimum ticket transaction amount of ₹400.',
      'Offer valid on all days of the week, including premiere shows.',
      'Can be clubbed with complimentary cinema popcorn vouchers where available.'
    ]
  },
  {
    id: 3,
    title: 'Flat ₹100 Cashback via PhonePe UPI',
    code: 'PHONEPE100',
    category: 'upi',
    bank: 'PhonePe',
    bankColor: 'bg-purple-600',
    discount: '₹100 Cashback',
    tag: 'UPI Deal',
    validTill: '30 Nov 2026',
    description: 'Pay using PhonePe UPI or Wallet and get guaranteed ₹100 cashback credited directly to your bank account.',
    terms: [
      'Minimum booking amount of ₹350.',
      'Cashback will be credited within 24 hours of successful payment.',
      'Valid once per user during the promotional period.'
    ]
  },
  {
    id: 4,
    title: 'SBI SimplyCLICK 20% Off on Weekend Blockbusters',
    code: 'SBICLICK',
    category: 'credit',
    bank: 'SBI Card',
    bankColor: 'bg-blue-800',
    discount: '20% Weekend Off',
    tag: 'Weekend Special',
    validTill: '31 Dec 2026',
    description: 'Exclusive 20% discount on Saturday and Sunday movie screenings for all SBI SimplyCLICK credit cardholders.',
    terms: [
      'Valid exclusively for Friday, Saturday, and Sunday showtimes.',
      'Maximum discount amount ₹150 per transaction.',
      'Valid on both online ticket bookings and mobile app purchases.'
    ]
  },
  {
    id: 5,
    title: 'Axis Bank Burgundy Card - Free IMAX Upgrade',
    code: 'AXISIMAX',
    category: 'credit',
    bank: 'Axis Bank',
    bankColor: 'bg-pink-700',
    discount: 'Free IMAX Upgrade',
    tag: 'Premium Luxury',
    validTill: '31 Dec 2026',
    description: 'Book standard tickets and enjoy automatic free upgrade to IMAX or Dolby Atmos screens with Axis Burgundy.',
    terms: [
      'Applicable on Axis Burgundy Private & Select credit cards only.',
      'Subject to seat availability in premium audio/video formats.',
      'Includes complimentary gourmet beverage at select multiplexes.'
    ]
  },
  {
    id: 6,
    title: 'Paytm Wallet Guaranteed ₹75 Cashback',
    code: 'PAYTMMOVIE',
    category: 'upi',
    bank: 'Paytm',
    bankColor: 'bg-cyan-600',
    discount: '₹75 Instant Cashback',
    tag: 'Wallet Special',
    validTill: '20 Nov 2026',
    description: 'Link your Paytm Wallet during checkout and get ₹75 instant cashback added to your wallet balance.',
    terms: [
      'Valid on minimum transaction value of ₹300.',
      'Instant scratch card delivered inside the Paytm app.',
      'Valid twice per month per registered phone number.'
    ]
  },
  {
    id: 7,
    title: 'Cinema Partner Special: Free Popcorn on 2+ Tickets',
    code: 'SNACKFEST',
    category: 'cinema',
    bank: 'Multiplex Partners',
    bankColor: 'bg-red-600',
    discount: 'Free Regular Popcorn',
    tag: 'Food & Beverage',
    validTill: '31 Dec 2026',
    description: 'Book 2 or more tickets at any PVR, INOX, or Cinepolis theater and redeem a free regular salted popcorn at the food counter.',
    terms: [
      'Digital F&B coupon generated inside your ticket pass.',
      'Valid on morning and afternoon shows up to 5:00 PM.',
      'Show your ticket QR code at the snack bar counter.'
    ]
  },
  {
    id: 8,
    title: 'Kotak Bank Everyday 10% Instant Discount on Debit Cards',
    code: 'KOTAKDEBIT',
    category: 'debit',
    bank: 'Kotak Mahindra',
    bankColor: 'bg-red-700',
    discount: '10% Instant Off',
    tag: 'Debit Card',
    validTill: '10 Dec 2026',
    description: 'Avail 10% instant discount across all movie bookings made using Kotak 811 and Platinum Debit Cards.',
    terms: [
      'No minimum booking amount requirement.',
      'Maximum discount capped at ₹100 per transaction.',
      'Valid across all participating cities and regions.'
    ]
  }
];

const Offers = () => {
  const [activeTab, setActiveTab] = useState('all'); // all | credit | debit | upi | cinema
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setToastMessage(`Promo code "${code}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode('');
      setToastMessage('');
    }, 3000);
  };

  const filteredOffers = offersData.filter((offer) => {
    const matchesTab = activeTab === 'all' || offer.category === activeTab;
    const matchesSearch = 
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.discount.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBank = !selectedBank || offer.bank.toLowerCase().includes(selectedBank.toLowerCase());
    return matchesTab && matchesSearch && matchesBank;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-800 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1C2A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-slide-up">
          <div className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold">{toastMessage}</p>
            <p className="text-[10px] text-gray-400">Paste in the payment step to claim discount</p>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#2B3148] via-[#1E2235] to-[#2B3148] text-white py-14 px-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F84464]/20 border border-[#F84464]/30 text-pink-300 text-xs font-semibold mb-4">
            <Percent className="w-3.5 h-3.5 text-[#F84464]" />
            Best Ticket Deals & Bank Privileges
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Exclusive <span className="text-[#F84464]">Offers & Discounts</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mb-8">
            Save up to 50% or claim 1-on-1 free tickets with premier credit cards, UPI cashback, and cinema partner promotions.
          </p>

          {/* Search & Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl bg-white p-2 rounded-2xl shadow-xl">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Bank (HDFC, ICICI), BOGO, Card..." 
                className="w-full bg-transparent outline-none text-gray-800 text-sm py-2"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-gray-400 hover:text-gray-600">
                  Clear
                </button>
              )}
            </div>

            <select 
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl outline-none border border-gray-200"
            >
              <option value="">All Banks & Wallets</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="SBI">SBI Card</option>
              <option value="Axis">Axis Bank</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Paytm">Paytm</option>
              <option value="Kotak">Kotak Mahindra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Offers', icon: Sparkles },
            { id: 'credit', label: 'Credit Cards', icon: CreditCard },
            { id: 'debit', label: 'Debit Cards', icon: CreditCard },
            { id: 'upi', label: 'UPI & Wallets', icon: Wallet },
            { id: 'cinema', label: 'Cinema Combos & Popcorn', icon: Coffee }
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-[#F84464] text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Offers Cards Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Showing <span className="text-[#333333] font-black">{filteredOffers.length}</span> Active Offers
          </p>

          {(searchQuery || selectedBank || activeTab !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBank('');
                setActiveTab('all');
              }}
              className="text-xs font-semibold text-[#F84464] hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {filteredOffers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No offers found matching your filter</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              Try searching for "HDFC", "Credit Card", or switch back to "All Offers" to browse all deals.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedBank('');
                setActiveTab('all');
              }}
              className="bg-[#F84464] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#d63a56]"
            >
              View All Offers
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredOffers.map((offer) => {
              const isExpanded = expandedId === offer.id;
              const isCopied = copiedCode === offer.code;

              return (
                <div 
                  key={offer.id} 
                  className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6">
                    {/* Top Header */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[11px] font-extrabold text-white px-2.5 py-1 rounded-lg ${offer.bankColor}`}>
                          {offer.bank}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {offer.tag}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                          {offer.discount}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      {offer.description}
                    </p>

                    {/* Promo Code Box */}
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-300 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-gray-400">Coupon Code:</span>
                        <span className="font-mono font-black text-sm text-gray-900 tracking-wider">
                          {offer.code}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(offer.code)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isCopied 
                            ? 'bg-green-600 text-white' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-[#F84464] hover:text-[#F84464]'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-400">
                      Valid till: <strong className="text-gray-600">{offer.validTill}</strong>
                    </p>

                    {/* Terms & Conditions Dropdown */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-1.5 animate-fade-in bg-gray-50/70 p-3 rounded-xl">
                        <p className="font-bold text-gray-800 flex items-center gap-1 text-[11px] uppercase tracking-wider mb-2">
                          <Info className="w-3.5 h-3.5 text-[#F84464]" /> Terms & Conditions
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500">
                          {offer.terms.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : offer.id)}
                      className="font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Terms' : 'View Terms'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <Link
                      to="/"
                      className="bg-[#F84464] hover:bg-[#d63a56] text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                    >
                      Book Movies Now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How to Redeem Box */}
        <div className="mt-16 bg-white rounded-3xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F84464]">Quick Guide</span>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              How to Apply Offers on BookMyShow
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-red-100 text-[#F84464] font-black flex items-center justify-center mx-auto mb-3 text-sm">
                1
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-800 mb-1">Pick Movie & Seats</h4>
              <p className="text-[11px] text-gray-500">Select your favorite movie, theater, showtime, and desired seats.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-red-100 text-[#F84464] font-black flex items-center justify-center mx-auto mb-3 text-sm">
                2
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-800 mb-1">Proceed to Payment</h4>
              <p className="text-[11px] text-gray-500">Go to checkout screen and click on 'Unlock Offers / Promo Code'.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-red-100 text-[#F84464] font-black flex items-center justify-center mx-auto mb-3 text-sm">
                3
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-800 mb-1">Paste Promo Code</h4>
              <p className="text-[11px] text-gray-500">Enter your copied code or pay with eligible bank card/UPI.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 font-black flex items-center justify-center mx-auto mb-3 text-sm">
                4
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-800 mb-1">Enjoy Savings!</h4>
              <p className="text-[11px] text-gray-500">Discount is instantly deducted from the total ticket amount.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offers;
