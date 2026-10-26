import { Outlet, useLocation, Link } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { 
  Building2, 
  Film, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  Plus
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  // Dynamic Header Titles & Subtitles
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/admin/theaters':
        return {
          title: 'Theaters & Partner Audits',
          subtitle: 'Manage verified cinema properties, auditoriums, and partner credentials'
        };
      case '/admin/add-show':
        return {
          title: 'Show Programming Desk',
          subtitle: 'Schedule movie showtimes across multiplexes and single screen theaters'
        };
      case '/admin/bookings':
        return {
          title: 'Live Admissions Ledger',
          subtitle: 'Real-time record of all confirmed customer bookings and ticket issuances'
        };
      case '/admin/scanner':
        return {
          title: 'Gate Security Scanner',
          subtitle: 'Verify QR codes and validate customer ticket entry'
        };
      case '/admin':
      default:
        return {
          title: 'Operations Overview',
          subtitle: 'Central real-time monitoring of box office revenue, admissions, and catalog'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 1. Left Fixed Sidebar */}
      <AdminSidebar />

      {/* 2. Top Fixed Navbar */}
      <header className="fixed top-0 right-0 left-64 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/90 px-8 flex items-center justify-between shadow-xs">
        
        {/* Dynamic Section Title */}
        <div>
          <h1 className="text-base font-extrabold text-gray-900 leading-tight">
            {headerInfo.title}
          </h1>
          <p className="text-[11px] text-gray-500 leading-tight hidden sm:block">
            {headerInfo.subtitle}
          </p>
        </div>

        {/* Right Tools & Admin Profile */}
        <div className="flex items-center gap-3">
          
          {/* Quick Shortcuts */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/admin/theaters"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Theaters</span>
            </Link>

            <Link
              to="/admin/add-show"
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#F84464] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Program Show</span>
            </Link>
          </div>

          <div className="h-5 w-[1px] bg-gray-200 hidden lg:block"></div>

          {/* Platform Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Connected</span>
          </div>

          {/* Admin User Badge */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F84464] to-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              AD
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-gray-900 block leading-tight">Administrator</span>
              <span className="text-[10px] text-gray-400 block leading-none">Central Ops</span>
            </div>
          </div>

        </div>

      </header>

      {/* 3. Main Scrollable Content Area */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
