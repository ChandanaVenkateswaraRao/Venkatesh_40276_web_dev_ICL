import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, Info, Heart, Search, X, Utensils, Smartphone, Moon, Sun, ArrowLeft } from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import SeatQuantityModal from '../components/SeatQuantityModal';
import { API_BASE_URL } from '../api/config';

const Theaters = () => {
  const { id } = useParams(); // movieId
  const navigate = useNavigate();
  const { city } = useLocationContext();
  
  const [movie, setMovie] = useState(null);
  const [theatersData, setTheatersData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date selection state
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Filters state
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('All');
  const [searchTheaterText, setSearchTheaterText] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState(null); // 'late_night' | 'early_morning' | null
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorite_theaters') || '[]');
    } catch {
      return [];
    }
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [infoModalTheater, setInfoModalTheater] = useState(null);

  // Generate 7 upcoming dates starting from today
  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        month: monthNames[d.getMonth()],
        fullDate: d.toISOString().split('T')[0],
        dateObj: d
      });
    }
    return dates;
  }, []);

  const selectedDate = upcomingDates[selectedDateIndex];

  // Fetch movie and showtimes for selected city and date
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [movieRes, theatersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/movies/${id}`),
          axios.get(`${API_BASE_URL}/theaters/${id}/showtimes?city=${city}&date=${selectedDate?.fullDate}`)
        ]);
        setMovie(movieRes.data);
        setTheatersData(theatersRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (selectedDate) {
      fetchData();
    }
  }, [id, city, selectedDate]);

  // Handle Favorite toggle
  const toggleFavorite = (theaterId) => {
    const updated = favorites.includes(theaterId)
      ? favorites.filter(fid => fid !== theaterId)
      : [...favorites, theaterId];
    setFavorites(updated);
    localStorage.setItem('favorite_theaters', JSON.stringify(updated));
  };

  const handleShowtimeClick = (st) => {
    setSelectedShowtime(st);
    setIsModalOpen(true);
  };

  const handleConfirmQuantity = (quantity) => {
    setIsModalOpen(false);
    if (selectedShowtime) {
      navigate(`/book/${selectedShowtime._id}?quantity=${quantity}`);
    }
  };

  // Helper to parse showtime hour for time filters
  const getShowtimeHour = (timeStr) => {
    // format like "12:20 PM" or "07:30 PM"
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 12;
    let hour = parseInt(match[1]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour;
  };

  // Filter theaters and showtimes based on active filters
  const filteredTheaters = useMemo(() => {
    return theatersData.map(group => {
      // Filter showtimes inside each theater
      const matchingShowtimes = group.showtimes.filter(st => {
        const hour = getShowtimeHour(st.time);

        // Quick filter
        if (quickFilter === 'late_night' && hour < 22) return false;
        if (quickFilter === 'early_morning' && (hour >= 12 || hour < 6)) return false;

        // Preferred Time filter
        if (selectedTimeOfDay === 'Morning' && (hour >= 12 || hour < 6)) return false;
        if (selectedTimeOfDay === 'Afternoon' && (hour < 12 || hour >= 16)) return false;
        if (selectedTimeOfDay === 'Evening' && (hour < 16 || hour >= 19)) return false;
        if (selectedTimeOfDay === 'Night' && hour < 19) return false;

        // Price range filter
        if (selectedPriceRange === 'under200' && (st.priceExecutive > 200 && st.pricePremium > 200)) return false;
        if (selectedPriceRange === '201to350' && (st.priceExecutive < 201 || st.priceExecutive > 350)) return false;
        if (selectedPriceRange === 'above350' && (st.pricePremium < 351 && st.priceExecutive < 351)) return false;

        // Format filter
        if (selectedFormat !== 'All' && st.format && !st.format.toLowerCase().includes(selectedFormat.toLowerCase())) {
          return false;
        }

        return true;
      });

      // Theater name search
      const matchesSearch = searchTheaterText.trim() === '' || 
        group.theater.name.toLowerCase().includes(searchTheaterText.toLowerCase()) ||
        (group.theater.location && group.theater.location.toLowerCase().includes(searchTheaterText.toLowerCase()));

      return {
        ...group,
        showtimes: matchingShowtimes,
        hasMatches: matchesSearch && matchingShowtimes.length > 0
      };
    }).filter(group => group.hasMatches);
  }, [theatersData, quickFilter, selectedTimeOfDay, selectedPriceRange, selectedFormat, searchTheaterText]);

  const clearAllFilters = () => {
    setSelectedFormat('All');
    setSelectedPriceRange('All');
    setSelectedTimeOfDay('All');
    setQuickFilter(null);
    setSearchTheaterText('');
    setIsSearchOpen(false);
  };

  const hasActiveFilters = selectedFormat !== 'All' || selectedPriceRange !== 'All' || selectedTimeOfDay !== 'All' || quickFilter !== null || searchTheaterText !== '';

  return (
    <div className="bg-[#F5F5F5] min-h-screen text-[#333333]">
      
      {/* 1. MOVIE HEADER STRIP */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-xs">
        <div className="container mx-auto px-4 max-w-7xl py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate(-1)} 
                  className="p-1 -ml-1 text-gray-500 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F2533]">
                  {movie?.title || 'Loading Movie...'}
                </h1>
              </div>

              {/* Movie Tags (Runtime, Certification, Genres) */}
              <div className="flex items-center gap-2 mt-2 flex-wrap text-xs font-medium text-gray-500">
                <span className="border border-gray-300 rounded-full px-3 py-0.5">
                  Movie runtime: 2h 45m
                </span>
                <span className="border border-gray-300 rounded-full px-3 py-0.5">
                  UA16+
                </span>
                {movie?.genre?.split(/[/,]/).map((g, idx) => (
                  <span key={idx} className="border border-gray-300 rounded-full px-3 py-0.5">
                    {g.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* City indicator */}
            <div className="text-xs text-gray-500 flex items-center gap-1 self-start md:self-auto">
              <span>Showing theaters in</span>
              <span className="font-semibold text-gray-800">{city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DATE SELECTOR & FILTER BAR */}
      <div className="bg-white border-b shadow-sm sticky top-[73px] md:top-[81px] z-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 py-2">
            
            {/* Horizontal Date Pills */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
              {upcomingDates.map((d, index) => {
                const isSelected = selectedDateIndex === index;
                return (
                  <button
                    key={d.fullDate}
                    onClick={() => setSelectedDateIndex(index)}
                    className={`flex flex-col items-center justify-center min-w-[56px] sm:min-w-[62px] py-2 px-1.5 rounded-xl transition-all cursor-pointer select-none
                      ${isSelected
                        ? 'bg-[#F84464] text-white shadow-md shadow-pink-500/20 font-bold scale-[1.02]'
                        : 'text-gray-600 hover:bg-gray-100 font-medium'
                      }`}
                  >
                    <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {d.dayName}
                    </span>
                    <span className="text-base sm:text-lg font-bold leading-tight">
                      {d.dayNum}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] uppercase ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {d.month}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Dropdowns on the Right */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar text-xs text-gray-700">
              
              {/* Language / Format */}
              <div className="relative flex-shrink-0">
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 hover:border-gray-400 rounded-lg px-3 py-2 pr-7 text-xs font-medium cursor-pointer outline-none focus:border-[#F84464]"
                >
                  <option value="All">{movie?.language || 'Telugu'} - 2D</option>
                  <option value="BARCO">HDR BY BARCO</option>
                  <option value="LASER">BARCO 4K LASER</option>
                  <option value="DOLBY">Dolby Atmos</option>
                  <option value="4DX">4DX</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Price Range */}
              <div className="relative flex-shrink-0">
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 hover:border-gray-400 rounded-lg px-3 py-2 pr-7 text-xs font-medium cursor-pointer outline-none focus:border-[#F84464]"
                >
                  <option value="All">Price Range</option>
                  <option value="under200">Rs. 0 - 200</option>
                  <option value="201to350">Rs. 201 - 350</option>
                  <option value="above350">Rs. 351+</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Preferred Time */}
              <div className="relative flex-shrink-0">
                <select
                  value={selectedTimeOfDay}
                  onChange={(e) => setSelectedTimeOfDay(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 hover:border-gray-400 rounded-lg px-3 py-2 pr-7 text-xs font-medium cursor-pointer outline-none focus:border-[#F84464]"
                >
                  <option value="All">Preferred Time</option>
                  <option value="Morning">Morning (12 AM - 12 PM)</option>
                  <option value="Afternoon">Afternoon (12 PM - 4 PM)</option>
                  <option value="Evening">Evening (4 PM - 7 PM)</option>
                  <option value="Night">Night (7 PM - 12 AM)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search Toggle / Input */}
              <div className="relative flex-shrink-0 flex items-center">
                {isSearchOpen ? (
                  <div className="flex items-center border border-gray-300 rounded-lg px-2 py-1 bg-white">
                    <input
                      type="text"
                      placeholder="Search theater..."
                      value={searchTheaterText}
                      onChange={(e) => setSearchTheaterText(e.target.value)}
                      className="text-xs outline-none w-28 sm:w-36 text-gray-800"
                      autoFocus
                    />
                    <button onClick={() => { setIsSearchOpen(false); setSearchTheaterText(''); }} className="text-gray-400 hover:text-black">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 border border-gray-200 hover:border-gray-400 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
                    title="Search Theaters"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 3. SUB-FILTER CHIPS & LEGEND BAR */}
      <div className="bg-[#FAF9F8] border-b border-gray-200 py-2.5">
        <div className="container mx-auto px-4 max-w-7xl flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Quick Time Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setQuickFilter(quickFilter === 'late_night' ? null : 'late_night')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer font-medium
                ${quickFilter === 'late_night'
                  ? 'border-[#F84464] bg-[#F84464] text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Moon className="w-3 h-3" />
              <span>Late night shows</span>
            </button>

            <button
              onClick={() => setQuickFilter(quickFilter === 'early_morning' ? null : 'early_morning')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer font-medium
                ${quickFilter === 'early_morning'
                  ? 'border-[#F84464] bg-[#F84464] text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Sun className="w-3 h-3" />
              <span>Early morning shows</span>
            </button>

            {hasActiveFilters && (
              <button 
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-[#F84464] hover:text-[#d63a56] font-semibold ml-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Availability Legend */}
          <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ABD5D]"></span>
              <span>AVAILABLE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF9644]"></span>
              <span>FAST FILLING</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THEATERS & SHOWTIMES LIST */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F84464]"></div>
            <p className="text-sm text-gray-500">Finding best theaters and showtimes in {city}...</p>
          </div>
        ) : filteredTheaters.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200 max-w-xl mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#F84464]">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Shows Found</h3>
            <p className="text-gray-500 text-sm mb-6">
              We couldn't find any shows matching your current filter in {city} for {selectedDate?.dayName}, {selectedDate?.dayNum} {selectedDate?.month}.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="bg-[#F84464] hover:bg-[#d63a56] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 shadow-xs">
            {filteredTheaters.map((group) => {
              const theater = group.theater;
              const isFav = favorites.includes(theater._id);

              return (
                <div 
                  key={theater._id} 
                  className="p-5 md:p-6 flex flex-col lg:flex-row gap-6 hover:bg-gray-50/50 transition-colors"
                >
                  
                  {/* Left Column: Theater Branding & Details */}
                  <div className="lg:w-[32%] flex flex-col justify-between">
                    <div>
                      {/* Name & Heart Icon */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Stylized Logo Badge */}
                          <div className="w-7 h-7 rounded bg-[#1F2533] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 uppercase">
                            {theater.name.slice(0, 3)}
                          </div>
                          
                          <h3 className="font-bold text-[#1F2533] text-sm md:text-base leading-snug">
                            {theater.name}
                          </h3>

                          {/* Info Button */}
                          <button
                            onClick={() => setInfoModalTheater(theater)}
                            className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors"
                            title="Theater Information"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Favorite Heart */}
                        <button 
                          onClick={() => toggleFavorite(theater._id)}
                          className="text-gray-300 hover:text-[#F84464] p-1 transition-colors"
                          title="Save Theater"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#F84464] text-[#F84464]' : ''}`} />
                        </button>
                      </div>

                      {/* Policy / Location */}
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium">
                          {theater.cancellable ? 'Cancellable' : 'Non-cancellable'}
                        </span>
                        {theater.location && (
                          <span className="ml-1 text-gray-400">• {theater.location}</span>
                        )}
                      </div>

                      {/* Amenities Badges */}
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1 text-[#00A854] font-medium">
                          <Smartphone className="w-3.5 h-3.5 text-[#00A854]" />
                          <span>M-Ticket</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#FF8500] font-medium">
                          <Utensils className="w-3.5 h-3.5 text-[#FF8500]" />
                          <span>Food & Beverage</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Showtimes Pills */}
                  <div className="lg:w-[68%] flex flex-wrap gap-3 items-center content-start">
                    {group.showtimes.map((st) => {
                      const isFastFilling = st.status === 'FAST_FILLING';
                      
                      return (
                        <div key={st._id} className="relative group">
                          <button
                            onClick={() => handleShowtimeClick(st)}
                            className={`flex flex-col items-center justify-center min-w-[92px] sm:min-w-[104px] py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer
                              ${isFastFilling 
                                ? 'border-[#FF9644] text-[#E5832E] hover:bg-amber-50 hover:shadow-xs' 
                                : 'border-[#4ABD5D] text-[#4ABD5D] hover:bg-green-50 hover:shadow-xs'
                              }`}
                          >
                            <span className="font-bold text-xs sm:text-[13px] tracking-tight">
                              {st.time}
                            </span>
                            <span className="text-[9px] uppercase font-semibold text-gray-500 tracking-wide mt-0.5 truncate max-w-[90px]">
                              {st.format || 'HDR BY BARCO'}
                            </span>
                          </button>

                          {/* Hover Tooltip showing Pricing */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                            <div className="bg-[#333333] text-white text-[11px] rounded-lg py-2 px-3 shadow-xl whitespace-nowrap min-w-[130px]">
                              <p className="font-bold text-gray-200 border-b border-gray-600 pb-1 mb-1 text-center uppercase tracking-wider text-[10px]">
                                {st.status === 'FAST_FILLING' ? 'Fast Filling' : 'Available'}
                              </p>
                              <div className="flex justify-between gap-3 text-gray-300">
                                <span>Executive:</span>
                                <span className="font-bold text-white">₹{st.priceExecutive}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-gray-300">
                                <span>Premium:</span>
                                <span className="font-bold text-white">₹{st.pricePremium}</span>
                              </div>
                            </div>
                            <div className="w-2 h-2 bg-[#333333] rotate-45 -mt-1"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. THEATER INFO MODAL */}
      {infoModalTheater && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-fade-in">
            <button 
              onClick={() => setInfoModalTheater(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{infoModalTheater.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{infoModalTheater.location || infoModalTheater.city}</p>
            
            <div className="border-t border-gray-100 pt-4 mb-4">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Available Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {infoModalTheater.amenities?.map((amenity, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 text-xs text-gray-500">
              <p>• Parking available at venue</p>
              <p className="mt-1">• Outside food and beverages are not allowed inside the theater</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. BOOKMYSHOW SEAT QUANTITY MODAL */}
      <SeatQuantityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmQuantity} 
        showtimeInfo={selectedShowtime}
      />

    </div>
  );
};

export default Theaters;
