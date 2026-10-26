import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Film, 
  Ticket, 
  QrCode, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    {
      to: '/admin',
      label: 'Operations Overview',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      to: '/admin/theaters',
      label: 'Theaters & Partners',
      icon: Building2
    },
    {
      to: '/admin/add-show',
      label: 'Program Shows',
      icon: Film
    },
    {
      to: '/admin/bookings',
      label: 'Bookings Ledger',
      icon: Ticket
    },
    {
      to: '/admin/scanner',
      label: 'Gate Scanner',
      icon: QrCode
    }
  ];

  return (
    <aside className="w-64 bg-[#161822] border-r border-gray-800/80 text-white fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between shadow-xl">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-gray-800/80 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F84464] text-white font-black text-xs flex items-center justify-center tracking-tight shadow-sm">
              BMS
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                book<span className="text-[#F84464]">my</span>show
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-semibold block mt-0.5">
                Central Operations
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-2 font-mono">
            Navigation Menu
          </span>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  active
                    ? 'bg-[#F84464] text-white shadow-sm shadow-rose-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${active ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    active ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Quick Link */}
      <div className="p-4 border-t border-gray-800/80 space-y-3">
        {/* Platform Status Indicator */}
        <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-gray-300 font-medium">Platform Online</span>
          </div>
          <span className="text-emerald-400 font-mono font-bold text-[10px]">v2.4</span>
        </div>

        {/* Public Website Link */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-gray-700/50 cursor-pointer"
        >
          <span>View Public Website</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
