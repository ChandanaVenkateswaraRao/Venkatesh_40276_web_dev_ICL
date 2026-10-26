import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Menu, User, Building2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { useLocationContext } from '../context/LocationContext';
import LocationModal from './LocationModal';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { city } = useLocationContext();
  const token = localStorage.getItem('token');
  const partnerToken = localStorage.getItem('partner_token');

  let userName = 'User';
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.name) userName = parsed.name.split(' ')[0];
    }
  } catch (e) {
    // ignore
  }

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/movies?search=${searchQuery}&city=${city}`);
        setSearchResults(res.data);
        setIsSearchOpen(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, city]);

  // Hide on login, register, partner portal, and admin portal pages
  if (
    location.pathname === '/login' || 
    location.pathname === '/register' ||
    location.pathname.startsWith('/partner') ||
    location.pathname.startsWith('/theater') ||
    location.pathname.startsWith('/admin')
  ) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
    <header className="w-full relative z-40">
      {/* Top Main Header */}
      <div className="bg-[#333545] text-white">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-[68px]">
          {/* Left Side: Logo and Search */}
          <div className="flex items-center gap-4 lg:gap-6 w-full max-w-[70%]">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img 
                src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
                alt="bookmyshow logo" 
                className="w-[115px] h-auto"
              />
            </Link>
            
            <div className="hidden md:flex bg-white rounded flex-1 h-[40px] items-center px-3 gap-2 relative">
              <Search className="text-gray-500 w-5 h-5 flex-shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setIsSearchOpen(true); }}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                placeholder="Search for Movies, Events, Plays, Sports and Activities" 
                className="w-full bg-transparent outline-none text-gray-800 text-[14px]"
              />
              
              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-12 left-0 w-full bg-white text-black shadow-xl border rounded-lg overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-gray-500 text-sm">No results found</div>
                  ) : (
                    searchResults.map(movie => (
                      <div 
                        key={movie._id} 
                        onClick={() => {
                          navigate(`/movie/${movie._id}`);
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer flex gap-4 items-center border-b last:border-0"
                      >
                        <img src={movie.image} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                        <div>
                          <p className="font-semibold text-sm">{movie.title}</p>
                          <p className="text-xs text-gray-500">{movie.language} • {movie.genre}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Location, Auth, Menu */}
          <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
            <div 
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex items-center gap-1 cursor-pointer hover:text-white text-gray-300 transition-colors"
            >
              <span className="text-[14px]">{city}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            
            {token ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-1.5 text-gray-300 hover:text-white text-[14px] font-medium transition-colors">
                  <User className="w-4 h-4" />
                  Hi, {userName}
                </Link>
                <button onClick={handleLogout} className="bg-[#F84464] hover:bg-[#d63a56] text-white px-5 py-[6px] rounded text-[12px] font-medium transition-colors cursor-pointer">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="bg-[#F84464] hover:bg-[#d63a56] text-white px-5 py-[6px] rounded text-[12px] font-medium transition-colors">
                  Sign In
                </Link>
                <Link 
                  to={partnerToken ? "/partner/dashboard" : "/partner/login"} 
                  className="hidden lg:flex items-center gap-1 text-xs text-pink-400 hover:text-white transition-colors bg-gray-800/80 px-2.5 py-1.5 rounded-lg border border-gray-700 font-semibold"
                  title="Theater Partner Portal"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#F84464]" />
                  <span>Partner Login</span>
                </Link>
              </div>
            )}

            <div className="cursor-pointer text-gray-300 hover:text-white">
              <Menu className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub Header */}
      <div className="bg-[#222539] text-[#CCCCCC] hidden md:block border-b border-[#222539]">
        <div className="container mx-auto px-4 max-w-7xl h-[40px] flex items-center justify-between text-[14px]">
          {/* Left Links */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link to="/" className="hover:text-white transition-colors">Movies</Link>
            {/* <Link to="/" className="hover:text-white transition-colors">Coming Soon</Link> */}
          </div>
          {/* Right Links */}
          <div className="flex items-center gap-4 lg:gap-6 text-[12px]">
            {!token && (
              <Link 
                to={partnerToken ? "/partner/dashboard" : "/partner/login"} 
                className="text-[#F84464] hover:text-white transition-colors font-bold flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>ListYourShow (Cinema Partner)</span>
              </Link>
            )}
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            {/* <Link to="/offers" className="hover:text-white transition-colors">Offers</Link> */}
            <Link to="/gift-cards" className="hover:text-white transition-colors">Gift Cards</Link>
            <Link to="/contact" className="hover:text-white transition-colors font-medium">Contact today!</Link>
          </div>
        </div>
      </div>
    </header>

    <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </>
  );
};

export default Navbar;
