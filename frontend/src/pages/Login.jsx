import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when typing
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, formData);
      localStorage.setItem('token', res.data.token);
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex bg-[#F5F5F5] p-4 md:p-8 justify-center items-center">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row w-full max-w-4xl overflow-hidden min-h-[500px]">
        
        {/* Left Side - Image/Branding */}
        <div className="hidden md:flex md:w-1/2 bg-[#2B314B] relative flex-col justify-between p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F84464] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1EA83C] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            <img 
              src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
              alt="bookmyshow logo" 
              className="w-48 mb-2"
            />
            <p className="text-gray-400">Your ticket to the best entertainment.</p>
          </div>
          
          <div className="relative z-10">
            <img src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800" alt="Cinema" className="rounded-xl shadow-2xl border-4 border-[#333545] transform -rotate-2 hover:rotate-0 transition-transform duration-500" />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#333333] mb-2">Welcome Back</h2>
            <p className="text-gray-500">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 mb-6 border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#F84464] focus:ring-2 focus:ring-[#F84464] focus:ring-opacity-20 transition-all" 
                  placeholder="john@example.com"
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-xs font-semibold text-[#F84464] hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  className="w-full pl-10 pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#F84464] focus:ring-2 focus:ring-[#F84464] focus:ring-opacity-20 transition-all" 
                  placeholder="••••••••"
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#F84464] text-white p-3.5 rounded-xl font-bold text-lg hover:bg-[#d63a56] transition-colors disabled:opacity-70 flex justify-center items-center mt-4 shadow-md shadow-red-500/30"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account? <Link to="/register" className="text-[#F84464] hover:underline font-bold">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
