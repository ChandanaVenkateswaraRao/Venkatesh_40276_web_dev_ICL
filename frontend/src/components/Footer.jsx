import { MonitorPlay } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  if (
    location.pathname === '/login' || 
    location.pathname === '/register' ||
    location.pathname.startsWith('/partner') ||
    location.pathname.startsWith('/theater') ||
    location.pathname.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <footer className="bg-[#313035] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
        {!token && (
          <div className="flex items-center gap-6 mb-10 w-full justify-between flex-wrap">
            <Link to="/partner/login" className="flex items-center gap-4 text-white hover:text-[#DC3558] cursor-pointer group">
               <div className="w-10 h-10 rounded-full bg-[#444444] group-hover:bg-[#DC3558] flex items-center justify-center transition-colors">
                 <MonitorPlay className="w-5 h-5 text-white" />
               </div>
               <div>
                 <p className="font-bold">List your Show / Partner with Us</p>
                 <p className="text-sm text-gray-400">Are you a Cinema Owner? Access the Theater Partner Dashboard to manage shows and pricing</p>
               </div>
            </Link>
            <Link to="/partner/login" className="bg-[#F84464] hover:bg-[#d63a56] text-white px-6 py-2 rounded text-sm font-medium transition-colors">
              Theater Partner Login
            </Link>
          </div>
        )}
        
        {/* Quick Nav Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 mb-8 font-medium">
          <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
          <span className="text-gray-600">•</span>
          <Link to="/" className="hover:text-white transition-colors">Movies</Link>
          <span className="text-gray-600">•</span>
          <Link to="/offers" className="hover:text-white transition-colors">Offers</Link>
          <span className="text-gray-600">•</span>
          <Link to="/gift-cards" className="hover:text-white transition-colors">Gift Cards & Wallet</Link>
          <span className="text-gray-600">•</span>
          <Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link>
          <span className="text-gray-600">•</span>
          <Link to="/partner/login" className="hover:text-white transition-colors">Partner Portal</Link>
        </div>

        <div className="w-full flex items-center justify-between border-t border-[#444444] pt-8">
          <div className="h-[1px] bg-[#444444] flex-1"></div>
          <div className="px-4">
             <img 
               src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
               alt="bookmyshow logo" 
               className="w-[115px] h-auto filter grayscale opacity-70"
             />
          </div>
          <div className="h-[1px] bg-[#444444] flex-1"></div>
        </div>
        
        <p className="text-xs text-gray-500 mt-8 text-center max-w-2xl">
          Copyright 2026 © Bigtree Entertainment Pvt. Ltd. All Rights Reserved.
          The content and images used on this site are copyright protected and copyrights vests with the respective owners.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
