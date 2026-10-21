import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Film, Ticket, Settings, QrCode } from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-[#2B314B] min-h-screen text-white p-5 flex flex-col gap-6 fixed h-full z-20">
      <div className="text-2xl font-bold italic tracking-tighter mb-8 text-center text-[#F84464]">QuickShow Admin</div>
      
      <div className="flex flex-col gap-2">
        <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin') ? 'bg-[#F84464] text-white' : 'hover:bg-slate-700 text-gray-300'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link to="/admin/theaters" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/theaters') ? 'bg-[#F84464] text-white' : 'hover:bg-slate-700 text-gray-300'}`}>
          <Building2 className="w-5 h-5" />
          <span className="font-medium">Theaters & Partners</span>
        </Link>
        <Link to="/admin/add-show" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/add-show') ? 'bg-[#F84464] text-white' : 'hover:bg-slate-700 text-gray-300'}`}>
          <Film className="w-5 h-5" />
          <span className="font-medium">Add Show</span>
        </Link>
        <Link to="/admin/bookings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/bookings') ? 'bg-[#F84464] text-white' : 'hover:bg-slate-700 text-gray-300'}`}>
          <Ticket className="w-5 h-5" />
          <span className="font-medium">Bookings</span>
        </Link>
        <Link to="/admin/scanner" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/scanner') ? 'bg-[#F84464] text-white' : 'hover:bg-slate-700 text-gray-300'}`}>
          <QrCode className="w-5 h-5" />
          <span className="font-medium">Ticket Scanner</span>
        </Link>
        <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-slate-700 text-gray-300`}>
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </div>
  );
};

export default AdminSidebar;
