import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

const PartnerLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setError('Please enter your partner email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/partner/login`, loginForm);
      localStorage.setItem('partner_token', res.data.token);
      localStorage.setItem('partner_user', JSON.stringify(res.data.user));
      navigate('/partner/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-between selection:bg-[#F84464] selection:text-white">
      
      {/* Top Simple Brand Header */}
      <header className="px-6 py-5 border-b border-slate-800 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://in.bmscdn.com/webin/common/icons/logo.svg" 
              alt="BookMyShow" 
              className="h-8 w-auto filter brightness-0 invert"
            />
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-400 border-l border-slate-700 pl-3">
              Partner Portal
            </span>
          </Link>

          <Link 
            to="/admin/theaters"
            className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#F84464]" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* Card Header */}
          <div className="bg-[#1F2533] p-6 text-white text-center">
            <div className="w-12 h-12 bg-[#F84464] text-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Theater Partner Login</h1>
            <p className="text-xs text-slate-300 mt-1">
              Sign in to manage showtimes, live pricing & admissions
            </p>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8">
            
            {error && (
              <div className="mb-5 bg-rose-50 border border-rose-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Partner Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="e.g. owner@cinemas.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-[#F84464] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:border-[#F84464] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#F84464] hover:bg-[#D63A56] text-white py-3 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Theater partner onboarding is managed by BookMyShow administration.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Need access? Contact your regional theater operations manager.
              </p>
            </div>

          </div>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        BookMyShow Cinema Partner Console &bull; Secure Box Office Access
      </footer>

    </div>
  );
};

export default PartnerLogin;
