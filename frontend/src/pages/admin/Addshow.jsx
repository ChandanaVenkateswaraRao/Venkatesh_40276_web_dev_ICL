import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';
import { 
  Film, Plus, Calendar, Clock, Building2, CheckCircle, AlertCircle, 
  Sparkles, Layers, Tv, Star, RefreshCw, Eye, EyeOff 
} from 'lucide-react';

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi-NCR', 'Chennai', 'Pune', 'Kolkata'];

const Addshow = () => {
  const [activeTab, setActiveTab] = useState('add_movie'); // 'add_movie' | 'schedule_show'
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  // Form 1: Add Movie Form State
  const [movieForm, setMovieForm] = useState({
    title: '',
    image: '',
    genre: 'Action/Thriller',
    language: 'Telugu',
    rating: '8.5',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    cities: ['Hyderabad', 'Bengaluru', 'Mumbai'],
    // Option to schedule initial showtime immediately
    scheduleInitialShow: false,
    initialTheaterId: '',
    initialScreen: 'Audi 1',
    initialFormat: 'HDR BY BARCO',
    initialDate: new Date().toISOString().split('T')[0],
    initialTime: '12:20 PM',
    initialPriceExecutive: 200,
    initialPricePremium: 350
  });

  // Form 2: Schedule Show For Existing Movie Form State
  const [scheduleForm, setScheduleForm] = useState({
    movieId: '',
    theaterId: '',
    screen: 'Audi 1',
    format: 'HDR BY BARCO',
    date: new Date().toISOString().split('T')[0],
    time: '06:45 PM',
    priceExecutive: 200,
    pricePremium: 350
  });

  // Fetch all movies (including unlisted/without shows) and all theaters
  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [moviesRes, theatersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/movies?all=true`),
        axios.get(`${API_BASE_URL}/admin/theaters`)
      ]);
      setMovies(moviesRes.data);
      setTheaters(theatersRes.data);

      if (moviesRes.data.length > 0) {
        setScheduleForm(prev => ({
          ...prev,
          movieId: prev.movieId || moviesRes.data[0]._id
        }));
      }

      if (theatersRes.data.length > 0) {
        const firstTheater = theatersRes.data[0];
        const firstScreen = firstTheater.screens?.[0];
        setMovieForm(prev => ({
          ...prev,
          initialTheaterId: prev.initialTheaterId || firstTheater._id,
          initialScreen: firstScreen?.name || 'Audi 1',
          initialFormat: firstScreen?.screenType || 'HDR BY BARCO'
        }));
        setScheduleForm(prev => ({
          ...prev,
          theaterId: prev.theaterId || firstTheater._id,
          screen: firstScreen?.name || 'Audi 1',
          format: firstScreen?.screenType || 'HDR BY BARCO'
        }));
      }
    } catch (err) {
      console.error('Error fetching admin show data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update initial screen when initial theater changes in movieForm
  const handleInitialTheaterChange = (theaterId) => {
    const selected = theaters.find(t => t._id === theaterId);
    const screen = selected?.screens?.[0];
    setMovieForm(prev => ({
      ...prev,
      initialTheaterId: theaterId,
      initialScreen: screen?.name || 'Audi 1',
      initialFormat: screen?.screenType || 'HDR BY BARCO'
    }));
  };

  // Update screen selection in movieForm
  const handleInitialScreenChange = (screenName) => {
    const selectedTheater = theaters.find(t => t._id === movieForm.initialTheaterId);
    const matchedScreen = selectedTheater?.screens?.find(s => s.name === screenName);
    setMovieForm(prev => ({
      ...prev,
      initialScreen: screenName,
      initialFormat: matchedScreen?.screenType || prev.initialFormat
    }));
  };

  // Update scheduleForm theater change
  const handleScheduleTheaterChange = (theaterId) => {
    const selected = theaters.find(t => t._id === theaterId);
    const screen = selected?.screens?.[0];
    setScheduleForm(prev => ({
      ...prev,
      theaterId,
      screen: screen?.name || 'Audi 1',
      format: screen?.screenType || 'HDR BY BARCO'
    }));
  };

  // Update scheduleForm screen change
  const handleScheduleScreenChange = (screenName) => {
    const selectedTheater = theaters.find(t => t._id === scheduleForm.theaterId);
    const matchedScreen = selectedTheater?.screens?.find(s => s.name === screenName);
    setScheduleForm(prev => ({
      ...prev,
      screen: screenName,
      format: matchedScreen?.screenType || prev.format
    }));
  };

  // 1. Submit Add Movie Form
  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlertBanner(null);

    try {
      const payload = {
        title: movieForm.title,
        image: movieForm.image,
        genre: movieForm.genre,
        language: movieForm.language,
        rating: Number(movieForm.rating) || 8.0,
        trailerUrl: movieForm.trailerUrl,
        cities: movieForm.cities
      };

      if (movieForm.scheduleInitialShow && movieForm.initialTheaterId) {
        payload.initialShowtime = {
          theaterId: movieForm.initialTheaterId,
          screen: movieForm.initialScreen,
          format: movieForm.initialFormat,
          date: movieForm.initialDate,
          time: movieForm.initialTime,
          priceExecutive: Number(movieForm.initialPriceExecutive) || 200,
          pricePremium: Number(movieForm.initialPricePremium) || 350
        };
      }

      const res = await axios.post(`${API_BASE_URL}/movies`, payload);

      setAlertBanner({
        type: 'success',
        msg: movieForm.scheduleInitialShow 
          ? `Movie "${res.data.movie.title}" successfully published with live showtimes! It is now ACTIVE and visible on the user screen.`
          : `Movie "${res.data.movie.title}" saved to catalog. Note: It will only appear on user screens once active showtimes are scheduled.`
      });

      // Reset form
      setMovieForm(prev => ({
        ...prev,
        title: '',
        image: '',
        genre: 'Action/Thriller',
        language: 'Telugu',
        rating: '8.5',
        scheduleInitialShow: false
      }));

      fetchData();
    } catch (err) {
      setAlertBanner({
        type: 'error',
        msg: err.response?.data?.msg || err.response?.data?.errors?.[0]?.message || 'Failed to add movie'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Submit Schedule Show for Existing Movie Form
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlertBanner(null);

    try {
      await axios.post(`${API_BASE_URL}/admin/add-show`, scheduleForm);
      const chosenMovie = movies.find(m => m._id === scheduleForm.movieId);
      const chosenTheater = theaters.find(t => t._id === scheduleForm.theaterId);

      setAlertBanner({
        type: 'success',
        msg: `Showtime successfully published for "${chosenMovie?.title || 'Movie'}" at "${chosenTheater?.name || 'Theater'}"! This movie is now LIVE on user screens.`
      });

      fetchData();
    } catch (err) {
      setAlertBanner({
        type: 'error',
        msg: err.response?.data?.msg || err.response?.data?.errors?.[0]?.message || 'Failed to schedule showtime'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to get screens of currently selected theater
  const movieSelectedTheater = theaters.find(t => t._id === movieForm.initialTheaterId);
  const movieConfiguredScreens = movieSelectedTheater?.screens?.length > 0 
    ? movieSelectedTheater.screens 
    : [{ screenNumber: 1, name: 'Audi 1', screenType: 'Dolby Atmos', capacity: 200 }];

  const scheduleSelectedTheater = theaters.find(t => t._id === scheduleForm.theaterId);
  const scheduleConfiguredScreens = scheduleSelectedTheater?.screens?.length > 0 
    ? scheduleSelectedTheater.screens 
    : [{ screenNumber: 1, name: 'Audi 1', screenType: 'Dolby Atmos', capacity: 200 }];

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-[#F84464]">
              Admin Central Programming
            </span>
            <span className="text-xs text-gray-400">• Movie & Showtime Provisioning</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Film className="w-7 h-7 text-[#F84464]" />
            Movie Catalog & Showtime Scheduler
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Movies will only appear on user screens when at least one active showtime is scheduled.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('add_movie')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add_movie'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#F84464]" />
            Add New Movie
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule_show')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schedule_show'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Schedule Showtime for Existing Movie
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertBanner && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs animate-fade-in ${
          alertBanner.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {alertBanner.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-medium leading-relaxed">
            {alertBanner.msg}
          </div>
        </div>
      )}

      {/* TAB 1: ADD NEW MOVIE */}
      {activeTab === 'add_movie' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-gray-100">
          <div className="pb-4 mb-6 border-b border-gray-100">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Film className="w-5 h-5 text-[#F84464]" />
              Add New Movie to Catalog
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter movie metadata and optionally publish initial showtimes to make it immediately visible to users.
            </p>
          </div>

          <form onSubmit={handleMovieSubmit} className="space-y-6">
            
            {/* Movie Title & Image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Movie Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fauzi / Pushpa 2: The Rule"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Poster Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={movieForm.image}
                  onChange={(e) => setMovieForm({ ...movieForm, image: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                />
              </div>
            </div>

            {/* Genre, Language, Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Genre *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Action/Thriller"
                  value={movieForm.genre}
                  onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Language *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telugu, Hindi"
                  value={movieForm.language}
                  onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Rating (Out of 10) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={movieForm.rating}
                  onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                />
              </div>
            </div>

            {/* Cities Multi-Select Badges */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Release Cities (Active Regions)
              </label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map(city => {
                  const isChecked = movieForm.cities.includes(city);
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setMovieForm(prev => ({
                          ...prev,
                          cities: isChecked 
                            ? prev.cities.filter(c => c !== city)
                            : [...prev.cities, city]
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-rose-50 border-[#F84464] text-[#F84464]'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Showtime Schedule Toggle */}
            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="schedule_initial_toggle"
                  checked={movieForm.scheduleInitialShow}
                  onChange={(e) => setMovieForm({ ...movieForm, scheduleInitialShow: e.target.checked })}
                  className="w-4 h-4 text-[#F84464] accent-[#F84464] rounded cursor-pointer"
                />
                <label htmlFor="schedule_initial_toggle" className="text-xs font-bold text-gray-900 cursor-pointer flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F84464]" />
                  Schedule Initial Showtime Immediately (Makes movie go LIVE on user screen)
                </label>
              </div>

              {movieForm.scheduleInitialShow ? (
                <div className="pt-3 border-t border-rose-100 space-y-4 animate-fade-in">
                  <div className="text-[11px] text-rose-800 bg-rose-100/50 p-2.5 rounded-lg font-medium">
                    Selecting a theater and screen will automatically publish this movie with live showtimes. Users in that city will be able to discover and book tickets immediately!
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Select Cinema Theater *
                      </label>
                      <select
                        value={movieForm.initialTheaterId}
                        onChange={(e) => handleInitialTheaterChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-[#F84464]"
                      >
                        {theaters.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.name} ({t.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Auditorium Screen *
                      </label>
                      <select
                        value={movieForm.initialScreen}
                        onChange={(e) => handleInitialScreenChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-[#F84464]"
                      >
                        {movieConfiguredScreens.map(s => (
                          <option key={s.screenNumber || s.name} value={s.name}>
                            {s.name} ({s.screenType} • {s.capacity} seats)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={movieForm.initialDate}
                        onChange={(e) => setMovieForm({ ...movieForm, initialDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Time</label>
                      <input
                        type="text"
                        value={movieForm.initialTime}
                        onChange={(e) => setMovieForm({ ...movieForm, initialTime: e.target.value })}
                        placeholder="e.g. 12:20 PM"
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Executive (₹)</label>
                      <input
                        type="number"
                        min="50"
                        value={movieForm.initialPriceExecutive}
                        onChange={(e) => setMovieForm({ ...movieForm, initialPriceExecutive: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Premium (₹)</label>
                      <input
                        type="number"
                        min="50"
                        value={movieForm.initialPricePremium}
                        onChange={(e) => setMovieForm({ ...movieForm, initialPricePremium: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 pl-7">
                  Note: If you do not schedule an initial showtime now, this movie will remain unlisted on user screens until a partner theater schedules showtimes for it.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#F84464] hover:bg-[#d63451] text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Publishing Movie...
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  {movieForm.scheduleInitialShow ? 'Publish Movie & Launch Live Showtime' : 'Save Movie to Catalog'}
                </>
              )}
            </button>

          </form>
        </div>
      )}

      {/* TAB 2: SCHEDULE SHOW FOR EXISTING MOVIE */}
      {activeTab === 'schedule_show' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-gray-100">
          <div className="pb-4 mb-6 border-b border-gray-100">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Schedule Show for Existing Catalog Movie
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Select any movie from the catalog and add showtimes to a partner theater. This will make the movie visible to users.
            </p>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Movie */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Catalog Movie *
                </label>
                <select
                  required
                  value={scheduleForm.movieId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, movieId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
                >
                  {movies.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.language} • {m.genre})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Theater */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Target Cinema Theater *
                </label>
                <select
                  required
                  value={scheduleForm.theaterId}
                  onChange={(e) => handleScheduleTheaterChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
                >
                  {theaters.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.city} • {t.theaterType === 'single_screen' ? 'Single Screen' : `${t.screens?.length || 1} screens`})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Auditorium Screen */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Auditorium Screen *
                </label>
                <select
                  value={scheduleForm.screen}
                  onChange={(e) => handleScheduleScreenChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-blue-600"
                >
                  {scheduleConfiguredScreens.map(s => (
                    <option key={s.screenNumber || s.name} value={s.name}>
                      {s.name} ({s.screenType} • {s.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              {/* Projection Format */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Projection Format
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.format}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Showtime *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 06:45 PM"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Executive (₹) *</label>
                <input
                  type="number"
                  required
                  min="50"
                  value={scheduleForm.priceExecutive}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, priceExecutive: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Premium (₹) *</label>
                <input
                  type="number"
                  required
                  min="50"
                  value={scheduleForm.pricePremium}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, pricePremium: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 font-medium">
              Publishing this showtime will immediately link the movie to <strong>{scheduleSelectedTheater?.name || 'this theater'}</strong> and make it visible on the BookMyShow user screen in <strong>{scheduleSelectedTheater?.city || 'the selected city'}</strong>.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Publishing Showtime...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Publish Showtime & Go Live
                </>
              )}
            </button>

          </form>
        </div>
      )}

      {/* Movie Catalog Status Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
          <Film className="w-4 h-4 text-[#F84464]" />
          Current Movie Catalog & User Visibility
        </h3>
        
        {loadingData ? (
          <div className="text-center py-6 text-xs text-gray-400">Loading catalog...</div>
        ) : movies.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400">No movies in catalog. Add your first movie above!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {movies.map(m => (
              <div key={m._id} className="p-3 rounded-xl border border-gray-200 bg-slate-50/50 flex gap-3 items-center">
                <img src={m.image} alt={m.title} className="w-12 h-16 object-cover rounded-lg shadow-2xs shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-gray-900 truncate">{m.title}</h4>
                  <p className="text-[11px] text-gray-500 truncate">{m.language} • {m.genre}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('schedule_show');
                        setScheduleForm(prev => ({ ...prev, movieId: m._id }));
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      + Schedule Show
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Addshow;
