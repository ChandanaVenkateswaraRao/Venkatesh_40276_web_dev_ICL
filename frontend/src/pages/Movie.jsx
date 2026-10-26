import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, Share2, ChevronRight, X, Play } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Movie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Trailer Modal State
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(10);
  const [reviewText, setReviewText] = useState('');
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieRes, reviewsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/movies/${id}`),
          axios.get(`${API_BASE_URL}/movies/${id}/reviews`)
        ]);
        setMovie(movieRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmitReview = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const payload = { rating, text: reviewText };
      const res = await axios.post(`${API_BASE_URL}/movies/${id}/reviews`, payload, { headers });
      setReviews([res.data, ...reviews]);
      setIsReviewModalOpen(false);
      setReviewText('');
      alert('Review submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F5F5F5]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F84464]"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-20 text-gray-500 bg-[#F5F5F5] min-h-screen">
        <h2 className="text-2xl font-bold">Movie not found</h2>
        <button onClick={() => navigate('/')} className="text-[#F84464] mt-4 hover:underline">Return to Home</button>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen pb-12">
      {/* Hero Banner Section */}
      <div className="relative w-full text-white bg-black">
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center filter blur-xl"
          style={{ backgroundImage: `url(${movie.image})` }}
        ></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        
        <div className="container mx-auto max-w-7xl px-4 py-8 relative z-10 flex flex-col md:flex-row gap-8 lg:gap-12 min-h-[480px] items-center">
          <div className="w-[260px] h-[390px] rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
            <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
            <div className={`text-white text-center py-1 text-xs font-semibold tracking-wider ${movie.hasShows ? 'bg-black' : 'bg-amber-600'}`}>
              {movie.hasShows ? 'In cinemas' : 'Coming soon'}
            </div>
          </div>
          
          <div className="flex flex-col flex-1 justify-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{movie.title}</h1>
            
            <div className="flex items-center bg-[#333333]/80 backdrop-blur-sm w-max px-4 py-3 rounded-xl mb-6 cursor-pointer hover:bg-[#333333] transition-colors">
              <Star className="text-[#F84464] fill-current w-7 h-7 mr-2" />
              <div className="flex flex-col">
                <span className="text-xl font-bold flex items-center gap-1">{movie.rating}/10 <span className="text-sm font-normal text-gray-300">{reviews.length} Ratings</span></span>
              </div>
              <ChevronRight className="w-5 h-5 ml-4 text-gray-400" />
            </div>
            
            <div className="flex gap-3 mb-6 flex-wrap">
              <div className="bg-white text-black px-3 py-1 rounded text-[13px] font-medium tracking-wide">2D, 3D, IMAX</div>
              <div className="bg-white text-black px-3 py-1 rounded text-[13px] font-medium tracking-wide">{movie.language}, Telugu, Tamil</div>
            </div>
            
            <p className="text-gray-300 mb-8 text-[15px] font-medium">
              2h 45m • {movie.genre} • UA • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            
            <div className="flex gap-4 items-center flex-wrap">
              {movie.hasShows ? (
                <Link 
                  to={`/buytickets/${movie._id}`} 
                  className="bg-[#F84464] hover:bg-[#d63a56] text-white px-12 py-3.5 rounded-lg text-lg font-semibold w-max transition-colors shadow-lg"
                >
                  Book tickets
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Shows Opening Soon • Advance Notice
                  </span>
                </div>
              )}
              {movie.trailerUrl && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-8 py-3.5 rounded-lg text-lg font-semibold transition-all border border-white/30 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Trailer
                </button>
              )}
            </div>
          </div>
          
          <div className="absolute top-8 right-8 hidden md:block bg-black/50 p-3 rounded-full cursor-pointer hover:bg-black/70 transition-colors backdrop-blur-md">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      
      {/* About & Reviews Section */}
      <div className="container mx-auto max-w-7xl px-4 py-10 flex flex-col md:flex-row gap-8">
        
        {/* Left Column */}
        <div className="w-full lg:w-2/3">
          <h2 className="text-2xl font-bold mb-4 text-[#333333]">About the movie</h2>
          <p className="text-gray-700 leading-relaxed text-[15px]">
            {movie.title} is an epic journey that explores the depths of {movie.genre.toLowerCase()}. 
            Featuring breathtaking visuals and a gripping storyline, this movie is a must-watch on the big screen.
          </p>
          
          <div className="w-full h-px bg-gray-300 my-8"></div>
          
          <h2 className="text-2xl font-bold mb-4 text-[#333333]">Cast</h2>
          <div className="flex gap-6 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
               <div key={i} className="flex flex-col items-center min-w-[100px]">
                 <div className="w-24 h-24 rounded-full bg-gray-300 mb-2 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="Actor" className="w-full h-full object-cover"/>
                 </div>
                 <p className="text-[14px] font-medium text-center text-[#333333]">Actor {i}</p>
                 <p className="text-[12px] text-gray-500 text-center">as Character</p>
               </div>
            ))}
          </div>

          <div className="w-full h-px bg-gray-300 my-8"></div>

          {/* User Reviews */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#333333]">Top Reviews</h2>
            {token && (
              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="border border-[#F84464] text-[#F84464] px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-pink-50 transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-500">
                      {review.userId?.name ? review.userId.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#333333]">{review.userId?.name || 'User'}</h4>
                      <div className="flex items-center text-xs text-red-500 font-semibold gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {review.rating}/10
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{review.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up p-6 relative">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-[#333333] mb-6">How was the movie?</h2>
            
            <div className="mb-4 text-center">
              <span className="text-5xl font-bold text-[#F84464]">{rating}</span>
              <span className="text-xl text-gray-500">/10</span>
            </div>
            <input 
              type="range" min="1" max="10" 
              value={rating} 
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full mb-6 accent-[#F84464]"
            />
            
            <textarea 
              placeholder="What did you think of the movie?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm outline-none focus:border-[#F84464] h-24 resize-none mb-6"
            ></textarea>

            <button 
              onClick={handleSubmitReview}
              className="w-full bg-[#F84464] text-white py-3 rounded-lg font-semibold text-lg hover:bg-[#d63a56] transition-colors"
            >
              Submit Review
            </button>
          </div>
        </div>
      )}

      {/* Trailer Video Player Modal */}
      {isTrailerOpen && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="flex justify-between items-center px-4 py-3 bg-[#1A1A1A] border-b border-gray-800">
              <h3 className="font-bold text-white text-base truncate">{movie.title} - Official Trailer</h3>
              <button 
                onClick={() => setIsTrailerOpen(false)} 
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`${movie.trailerUrl}?autoplay=1`}
                title={`${movie.title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movie;
