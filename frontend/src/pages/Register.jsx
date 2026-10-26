import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, formData);
      if (res.data.requireOtp) {
        setOtpSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Error registering account');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email: formData.email, otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ name: formData.name, email: formData.email }));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex bg-[#F5F5F5] p-4 md:p-8 justify-center items-center">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row-reverse w-full max-w-4xl overflow-hidden min-h-[550px]">
        
        {/* Right Side - Image/Branding (Reversed for Register) */}
        <div className="hidden md:flex md:w-1/2 bg-[#2B314B] relative flex-col justify-between p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F84464] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1EA83C] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-20 -mb-20"></div>
          
          <div className="relative z-10 text-right">
            <img 
              src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
              alt="bookmyshow logo" 
              className="w-48 mb-2"
            />
            <p className="text-gray-400">Join millions of movie lovers today.</p>
          </div>
          
          <div className="relative z-10">
            <img src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=800" alt="Cinema Tickets" className="rounded-xl shadow-2xl border-4 border-[#333545] transform rotate-2 hover:rotate-0 transition-transform duration-500" />
          </div>
        </div>

        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          
          {!otpSent ? (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-[#333333] mb-2">Create an Account</h2>
                <p className="text-gray-500">Sign up to book tickets, write reviews, and more.</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 mb-6 border border-red-100 animate-fade-in-up">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      name="name"
                      className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#F84464] focus:ring-2 focus:ring-[#F84464] focus:ring-opacity-20 transition-all" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      placeholder="John Doe"
                    />
                  </div>
                </div>

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
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      className="w-full pl-10 pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#F84464] focus:ring-2 focus:ring-[#F84464] focus:ring-opacity-20 transition-all" 
                      value={formData.password} 
                      onChange={handleChange} 
                      required 
                      placeholder="••••••••"
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
                  className="w-full bg-[#F84464] text-white p-3.5 rounded-xl font-bold text-lg hover:bg-[#d63a56] transition-colors disabled:opacity-70 flex justify-center items-center mt-6 shadow-md shadow-red-500/30"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
              
              <p className="mt-8 text-center text-sm text-gray-600">
                Already have an account? <Link to="/login" className="text-[#F84464] hover:underline font-bold">Sign in</Link>
              </p>
            </>
          ) : (
            <div className="animate-fade-in-up flex flex-col justify-center h-full">
              <div className="mx-auto bg-green-100 text-[#1EA83C] p-4 rounded-full mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-center text-[#333333]">Verify Email</h2>
              <p className="text-sm text-center text-gray-500 mb-8">
                We've sent a 6-digit OTP to <br/>
                <span className="font-semibold text-gray-800">{formData.email}</span>
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center justify-center gap-2 mb-6 border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <input 
                    type="text" 
                    maxLength="6"
                    className="w-full p-4 text-center tracking-[0.75em] text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#F84464] focus:ring-2 focus:ring-[#F84464] focus:ring-opacity-20 transition-all" 
                    value={otp} 
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/[^0-9]/g, ''));
                      setError('');
                    }} 
                    required 
                    placeholder="000000"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || otp.length !== 6} 
                  className="w-full bg-[#1EA83C] text-white p-3.5 rounded-xl font-bold text-lg hover:bg-[#188a31] transition-colors disabled:opacity-70 flex justify-center items-center shadow-md shadow-green-500/30"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              </form>
              
              <button 
                onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                className="mt-6 text-center text-sm text-gray-500 hover:text-[#F84464] hover:underline font-medium mx-auto block"
              >
                Change email address
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
