import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Film, ArrowRight, CheckCircle2 } from 'lucide-react';

const ListYourShow = () => {
  return (
    <div className="min-h-[75vh] bg-[#F5F5F5] py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-[#F84464] rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          <Building2 className="w-4 h-4" />
          Cinema & Event Partnerships
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
          List Your Theater on bookmyshow
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
          Reach millions of movie lovers every day. All cinema partners are onboarded and verified centrally by our administrative team.
        </p>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-red-50 text-[#F84464] rounded-xl flex items-center justify-center mb-4">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Live Showtime Sync</h3>
            <p className="text-sm text-gray-500">
              Manage multi-screen scheduling, seat tiers, and dynamic peak pricing in real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Admin Verified</h3>
            <p className="text-sm text-gray-500">
              All cinema properties are vetted and registered by the platform Admin to maintain standard ticketing quality.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Instant Box Office</h3>
            <p className="text-sm text-gray-500">
              Receive live booking alerts and monitor occupancy, ticket revenue, and food add-ons seamlessly.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/partner/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#F84464] hover:bg-[#d63451] text-white font-bold rounded-xl shadow-lg shadow-[#F84464]/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <span>Partner Sign In</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/admin/theaters"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-gray-500" />
            <span>Admin Onboarding Portal</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ListYourShow;
