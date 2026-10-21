import { useState } from 'react';
import axios from 'axios';

const Addshow = () => {
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    genre: '',
    language: '',
    rating: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/movies', formData);
      alert('Movie successfully added!');
      setFormData({ title: '', image: '', genre: '', language: '', rating: '' });
    } catch (err) {
      console.error(err);
      alert('Error adding movie');
    }
  };

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Movie</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Movie Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#F84464]" placeholder="Enter movie title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (TMDB/Unsplash)</label>
          <input type="url" name="image" value={formData.image} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#F84464]" placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <input type="text" name="genre" value={formData.genre} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#F84464]" placeholder="e.g. Action/Thriller" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <input type="text" name="language" value={formData.language} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#F84464]" placeholder="e.g. English, Hindi" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rating (Out of 10)</label>
          <input type="number" step="0.1" max="10" name="rating" value={formData.rating} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#F84464]" placeholder="8.5" />
        </div>
        
        <button type="submit" className="mt-4 bg-[#F84464] hover:bg-[#d63a56] text-white py-3 rounded-lg font-semibold text-lg transition-colors">
          Publish Movie
        </button>
      </form>
    </div>
  );
};

export default Addshow;
