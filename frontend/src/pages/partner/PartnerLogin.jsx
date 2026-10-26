import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Building2, Film, CheckCircle, ArrowRight, ShieldCheck, Key, Lock, Info, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

const PartnerLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: 'owner@ambcinemas.com',
    password: 'password123'
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/partner/login`, loginForm);
      localStorage.setItem('partner_token', res.data.token);
      localStorage.setItem('partner_user', JSON.stringify(res.data.user));
      navigate('/partner/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, pwd) => {
    setLoginForm({ email, password: pwd });
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-3">
          <img 
            src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
            alt="bookmyshow logo" 
            className="w-36 h-auto mx-auto"
          />
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[#F84464] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>Theater Partner Portal</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          Cinema Partner Sign In
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Access your theater dashboard to manage showtimes, pricing, and live box office
        </p>
      </div>

      {/* Main Form Box */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          
          {/* Admin Managed Notification Pill */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-[#F84464] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Admin Managed Onboarding:</span>
              <p className="mt-0.5 text-slate-500 text-[11px]">
                Theaters and partner accounts are registered directly by the platform Admin. Please use the credentials assigned to your cinema.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Partner Email
              </label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="e.g., owner@ambcinemas.com"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#F84464] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#F84464] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F84464] hover:bg-[#d63a56] text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Theater Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 1-Click Demo Login Box */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Test With Registered Partners
                </p>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                  Live in DB
                </span>
              </div>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fillDemo('99230040276@klu.ac.in', 'password123')}
                  className="w-full py-2.5 px-3 bg-pink-50/50 hover:bg-pink-50 border border-pink-200/80 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-between transition-colors cursor-pointer text-left"
                >
                  <div>
                    <span className="font-bold text-[#F84464] block">Asian Cinemas: Hyderabad</span>
                    <span className="text-gray-500 text-[10px]">99230040276@klu.ac.in</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#F84464] text-white px-2 py-1 rounded-md">
                    Live Partner
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo('owner@ambcinemas.com', 'password123')}
                  className="w-full py-2.5 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-between transition-colors cursor-pointer text-left"
                >
                  <div>
                    <span className="font-bold text-gray-800 block">AMB Cinemas: Gachibowli</span>
                    <span className="text-gray-400 text-[10px]">owner@ambcinemas.com</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600">
                    Auto-Fill
                  </span>
                </button>
              </div>
            </div>

            {/* Link to Admin Portal for Registration */}
            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Need to register a new theater?
              </p>
              <Link 
                to="/admin/theaters" 
                className="inline-flex items-center gap-1 text-xs font-bold text-[#F84464] hover:underline mt-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Go to Admin Theater Management & Onboarding
              </Link>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
};

export default PartnerLogin;
