import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight, Star, Film } from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import { API_BASE_URL } from '../api/config';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { city } = useLocationContext();

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/movies?city=${city}`);
        setMovies(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [city]);

  return (
    <div className="w-full bg-[#F5F5F5] min-h-screen pb-12">
      {/* 1. Main Carousel Placeholder */}
      <div className="w-full bg-[#EBEBEB] cursor-pointer">
        <div className="max-w-[1440px] mx-auto">
          <div className="w-full bg-slate-800 relative overflow-hidden">
            <img 
              src="https://assets-in.bmscdn.com/promotions/cms/creatives/1726036566435_playcardnewweb.jpg" 
              alt="Carousel Banner" 
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>

      {/* 2. Recommended Movies Section from Backend */}
      <div className="max-w-7xl mx-auto px-4 mt-10 mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#222222]">Recommended Movies</h2>
          <Link to="/" className="text-[#F84464] flex items-center text-sm font-medium hover:underline">
            See All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F84464]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {movies.map((movie) => (
              <Link to={`/movie/${movie._id}`} key={movie._id} className="block group cursor-pointer">
                <div className="rounded-lg overflow-hidden mb-3 relative bg-gray-200 aspect-[2/3] shadow-sm">
                  <img 
                    src={movie.image} 
                    alt={movie.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 w-full bg-black/80 flex items-center px-3 py-1.5 gap-1.5 text-white text-[13px] font-medium backdrop-blur-sm">
                    <Star className="w-4 h-4 text-[#F84464] fill-current" />
                    <span>{movie.rating}/10  <span className="text-gray-300 text-[11px] ml-1 uppercase">40K Votes</span></span>
                  </div>
                </div>
                <h3 className="font-medium text-[18px] text-[#222222] truncate mt-1">{movie.title}</h3>
                <p className="text-[#666666] text-[15px] truncate">{movie.genre}</p>
              </Link>
            ))}
            {movies.length === 0 && (
              <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-[#F84464] flex items-center justify-center mx-auto mb-4">
                  <Film className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No Movies Currently Showing in {city || 'Selected City'}</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1.5">
                  Movies will automatically appear on your screen once partner theaters publish active showtimes for this city. Check back soon for newly published shows!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Premieres (Exclusive Movies Section) */}
      <div className="w-full bg-[#2B314B] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 cursor-pointer">
            <img src="https://assets-in.bmscdn.com/discovery-catalog/collections/tr:w-1440,h-120/premiere-rupay-banner-web-collection-202104230555.png" alt="Rupay Premiere" className="w-full rounded-xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Premieres</h2>
          <p className="text-white text-sm mb-6">Brand new movie releases every Friday</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {[
              { title: "Spider-Man", lang: "English", img: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg" },
              { title: "Guardians of the Galaxy", lang: "English", img: "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg" },
              { title: "The Batman", lang: "English", img: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg" },
              { title: "Dune: Part Two", lang: "English", img: "https://image.tmdb.org/t/p/w500/4gh9LSkVe1gr0Vteln1BjMIlJ07.jpg" },
              { title: "John Wick: Chapter 4", lang: "English", img: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg" },
            ].map((prem, idx) => (
              <Link to="/" key={idx} className="block group cursor-pointer">
                <div className="rounded-lg overflow-hidden mb-3 aspect-[2/3] relative shadow-sm">
                  <div className="absolute top-0 w-full bg-[#F84464] text-white text-[10px] px-2 py-1 font-bold uppercase tracking-widest text-center z-10">Premiere</div>
                  <img src={prem.img} alt={prem.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <h3 className="font-medium text-white text-[16px] truncate mt-1">{prem.title}</h3>
                <p className="text-[#CCCCCC] text-[14px] truncate">{prem.lang}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
