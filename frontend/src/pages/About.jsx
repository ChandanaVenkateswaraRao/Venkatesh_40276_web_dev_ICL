import { 
  Film, 
  ShieldCheck, 
  Zap, 
  Users, 
  CheckCircle2, 
  Building2, 
  Wallet, 
  Ticket, 
  ArrowRight, 
  Sparkles,
  Lock,
  Layers,
  HeartHandshake,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

const platformPillars = [
  {
    icon: Zap,
    title: 'Sub-Second Seat Concurrency',
    desc: 'Engineered with real-time WebSocket state management to lock seats instantaneously, preventing double-bookings and timeouts during blockbuster surges.'
  },
  {
    icon: Building2,
    title: 'Theater Partner Ecosystem',
    desc: 'Empowering cinema exhibitors—from single screens to modern multiplex chains—with dedicated portals to manage shows, screens, seat layouts, and dynamic pricing.'
  },
  {
    icon: Wallet,
    title: 'Frictionless Digital Wallet',
    desc: 'Integrated BookMyShow Wallet with real Razorpay gift card vouchers, offering zero-surcharge 1-click checkout and automated ledger tracking.'
  },
  {
    icon: QrCode,
    title: 'Verified Turnstile Admission',
    desc: 'Instant digital M-Tickets featuring tamper-proof QR verification and automated calendar sync (.ics) for seamless theater entry.'
  }
];

const platformStats = [
  { value: '5,000+', label: 'Connected Cinema Screens' },
  { value: '100%', label: 'Real-Time Concurrency' },
  { value: '650+', label: 'Cities & Regions Covered' },
  { value: 'Instant', label: 'Wallet & QR Checkout' }
];

const coreValues = [
  {
    title: 'Reliability Under Pressure',
    desc: 'When major blockbusters open advance bookings, our architecture scales seamlessly to keep seat selection responsive and accurate without server stalls.'
  },
  {
    title: 'Exhibitor-First Partnership',
    desc: 'We provide theater owners with transparent real-time booking feeds, seat occupancy insights, and flexible screen management tools to grow their business.'
  },
  {
    title: 'Security and Transparency',
    desc: 'Bank-grade Razorpay payment gateways, cryptographic signature validation, and immutable wallet transaction ledgers ensure complete peace of mind.'
  }
];

const About = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-800 pb-20">
      
      {/* 1. HERO HEADER - Clean, Professional Dark Brand Theme */}
      <div className="bg-[#1F2533] text-white py-16 sm:py-20 px-4 border-b border-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-gray-200 text-xs font-semibold mb-6">
            <Film className="w-3.5 h-3.5 text-[#F84464]" />
            <span>Next-Generation Cinema Ticketing & Exhibitor Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight text-white">
            Engineering Effortless Experiences for <br />
            <span className="text-[#F84464]">Moviegoers & Cinema Exhibitors</span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            We are building the modern digital infrastructure for Indian cinema: from live seat-locking concurrency to exhibitor SaaS portals, cashless wallets, and paperless turnstile admission.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link 
              to="/" 
              className="bg-[#F84464] hover:bg-[#d63a56] text-white px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Now Showing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link 
              to="/partner/login" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-pink-300" />
              <span>Cinema Partner Portal</span>
            </Link>
          </div>

        </div>
      </div>

      {/* 2. STATS BAR */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {platformStats.map((stat, idx) => (
            <div key={idx} className="text-center p-2 border-r last:border-r-0 border-gray-100">
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              <p className="text-[11px] font-semibold text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PLATFORM MISSION & STORY */}
      <div className="max-w-5xl mx-auto px-4 mt-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-sm">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F84464] block mb-2">
              Our Vision
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug mb-5">
              Built to eliminate friction between a moviegoer's anticipation and their theater seat.
            </h2>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Cinema in India is more than entertainment—it is a cultural phenomenon. Yet for decades, booking a movie ticket often meant dealing with frustrating box-office lines, uncertain seat availability, clunky interfaces, and payment drop-offs.
              </p>
              <p>
                This platform was conceptualized to address these structural challenges head-on. By uniting high-concurrency seat reservation engines, flexible multiplex management for theater operators, and integrated digital wallets, we deliver an experience that is instantaneous, completely verifiable, and transparent for everyone involved.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-6 mt-6 border-t border-gray-100 text-xs font-bold text-gray-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Zero seat conflicts with live socket locks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Instant QR passes with calendar integration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Integrated digital wallet & Razorpay checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Dedicated SaaS dashboard for cinema operators</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FOUNDER SPOTLIGHT - VENKATESH */}
      <div className="max-w-5xl mx-auto px-4 mt-14">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          
          <div className="p-8 sm:p-12">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F84464] bg-red-50 px-2.5 py-1 rounded-md">
                Leadership
              </span>
              <span className="text-xs font-medium text-gray-400">Founder & Chief Architect</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Founder Avatar & Bio Card */}
              <div className="lg:col-span-4 bg-[#F8F9FA] rounded-2xl p-6 border border-gray-200 text-center">
                <div className="w-24 h-24 rounded-2xl bg-[#1F2533] text-white flex items-center justify-center mx-auto mb-4 font-black text-2xl shadow-sm border-2 border-white">
                  V
                </div>
                <h3 className="text-xl font-bold text-gray-900">Venkatesh</h3>
                <p className="text-xs font-semibold text-[#F84464] mt-0.5">Founder & Lead Architect</p>
                
                <div className="mt-4 pt-4 border-t border-gray-200/80 text-left space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Focus:</span>
                    <span className="font-semibold text-gray-800">Platform Architecture</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mission:</span>
                    <span className="font-semibold text-gray-800">Cinema Modernization</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="font-semibold text-green-700">Active Development</span>
                  </div>
                </div>
              </div>

              {/* Founder Statement & Backstory */}
              <div className="lg:col-span-8 space-y-4">
                <h4 className="text-xl font-bold text-gray-900 leading-snug">
                  "Technology should enhance the magic of cinema, never get in its way."
                </h4>

                <p className="text-sm text-gray-600 leading-relaxed">
                  Venkatesh founded this platform with a clear technical ambition: solving the critical concurrency and user experience problems that have long plagued Indian online ticketing systems during high-demand movie premieres.
                </p>

                <p className="text-sm text-gray-600 leading-relaxed">
                  Recognizing that independent cinema exhibitors and local theater owners lacked modern, intuitive tools to compete with large chains, Venkatesh architected the platform from the ground up to be a dual-sided solution. It combines a seamless, instant consumer booking interface with an enterprise-grade partner portal where exhibitors can configure single-screen or multi-screen theaters, manage showtimes, and monitor booking feeds in real time.
                </p>

                <div className="p-4 bg-[#F8F9FA] rounded-xl border border-gray-200/80 mt-4">
                  <p className="text-xs italic text-gray-700 leading-relaxed">
                    "Our goal is straightforward: whether a customer is booking from a mobile phone in a metro city or a tier-2 town, their seat selection should lock in milliseconds, their payment should take seconds, and theater owners should receive live verified booking data without friction."
                  </p>
                  <p className="text-[11px] font-bold text-gray-900 mt-2">
                    — Venkatesh, Founder
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 5. ARCHITECTURAL PILLARS */}
      <div className="max-w-5xl mx-auto px-4 mt-14">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F84464] block mb-1">
            Engineered For Scale
          </span>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            How the Platform Works
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {platformPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#1F2533] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-1.5">{pillar.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. CORE COMMITMENTS */}
      <div className="max-w-5xl mx-auto px-4 mt-14">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F84464] block mb-2">
            Core Principles
          </span>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-8 tracking-tight">
            Our Commitments to Users & Partners
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreValues.map((val, idx) => (
              <div key={idx} className="p-5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80">
                <span className="text-xs font-mono font-bold text-gray-400 block mb-2">0{idx + 1}</span>
                <h4 className="text-sm font-bold text-gray-900 mb-1.5">{val.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. CLEAN BOTTOM CTA */}
      <div className="max-w-5xl mx-auto px-4 mt-14">
        <div className="bg-[#1F2533] text-white rounded-3xl p-8 sm:p-12 text-center border border-gray-800">
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Ready to Catch the Next Movie?
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto mb-7 leading-relaxed">
            Browse active releases in your city, select your preferred cinema, pick your seats with real-time locks, and pay seamlessly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link 
              to="/" 
              className="bg-[#F84464] hover:bg-[#d63a56] text-white px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
            >
              Browse Now Playing
            </Link>
            <Link 
              to="/gift-cards" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Gift Cards & Wallet
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;
