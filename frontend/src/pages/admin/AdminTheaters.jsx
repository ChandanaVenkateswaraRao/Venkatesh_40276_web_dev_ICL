import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Plus, Search, MapPin, ShieldCheck, Key, Edit2, Trash2, 
  CheckCircle, X, AlertCircle, Copy, ExternalLink, Ticket, Users, RefreshCw
} from 'lucide-react';

const POPULAR_AMENITIES = [
  'M-Ticket',
  'Food & Beverage',
  'Dolby Atmos',
  '4K Laser Projection',
  'Wheelchair Accessible',
  'Recliner Seats',
  'Valet Parking'
];

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi-NCR', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Kochi'];

const AdminTheaters = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  
  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successBanner, setSuccessBanner] = useState(null);

  const [registerForm, setRegisterForm] = useState({
    name: '',
    city: 'Hyderabad',
    location: '',
    cancellable: true,
    amenities: ['M-Ticket', 'Food & Beverage', 'Dolby Atmos'],
    ownerName: '',
    ownerEmail: '',
    ownerPassword: ''
  });

  // Edit Modal State
  const [editingTheater, setEditingTheater] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    city: 'Hyderabad',
    location: '',
    cancellable: true,
    amenities: [],
    ownerName: '',
    ownerEmail: ''
  });

  // Reset Password Modal State
  const [passwordModalTheater, setPasswordModalTheater] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordResetting, setPasswordResetting] = useState(false);

  // Fetch all theaters
  const fetchTheaters = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/admin/theaters');
      setTheaters(res.data);
    } catch (err) {
      console.error('Error fetching theaters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheaters();
  }, []);

  // Handle amenity toggle in registration form
  const toggleAmenity = (amenity) => {
    setRegisterForm(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  // Handle amenity toggle in edit form
  const toggleEditAmenity = (amenity) => {
    setEditForm(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  // Submit Theater Registration (Admin-Only Action)
  const handleRegisterTheater = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await axios.post('http://localhost:5000/api/admin/theaters', registerForm);
      setSuccessBanner({
        theaterName: res.data.theater.name,
        email: registerForm.ownerEmail,
        password: registerForm.ownerPassword
      });
      setIsRegisterModalOpen(false);
      
      // Reset form
      setRegisterForm({
        name: '',
        city: 'Hyderabad',
        location: '',
        cancellable: true,
        amenities: ['M-Ticket', 'Food & Beverage', 'Dolby Atmos'],
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
      });

      // Refresh list
      fetchTheaters();
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to register theater. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Theater
  const handleUpdateTheater = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/theaters/${editingTheater._id}`, editForm);
      setEditingTheater(null);
      fetchTheaters();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update theater');
    }
  };

  // Open Edit Modal
  const openEditModal = (th) => {
    setEditingTheater(th);
    setEditForm({
      name: th.name,
      city: th.city,
      location: th.location || '',
      cancellable: th.cancellable !== false,
      amenities: th.amenities || [],
      ownerName: th.owner?.name || '',
      ownerEmail: th.owner?.email || ''
    });
  };

  // Submit Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setPasswordResetting(true);
    try {
      await axios.post(`http://localhost:5000/api/admin/theaters/${passwordModalTheater._id}/reset-password`, {
        newPassword
      });
      alert(`Password successfully updated for ${passwordModalTheater.owner?.email || 'partner'}`);
      setPasswordModalTheater(null);
      setNewPassword('');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to reset password');
    } finally {
      setPasswordResetting(false);
    }
  };

  // Delete Theater
  const handleDeleteTheater = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will delete all its showtimes and partner account.`)) {
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/admin/theaters/${id}`);
      fetchTheaters();
    } catch (err) {
      alert('Failed to delete theater');
    }
  };

  // Filter Theaters
  const filteredTheaters = theaters.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.owner?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'ALL' || t.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Success Flash */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-base">Theater & Partner Successfully Registered!</h3>
              <p className="text-sm text-emerald-700">
                <span className="font-semibold">{successBanner.theaterName}</span> has been onboarded with initial showtimes scheduled.
              </p>
              <div className="mt-2 inline-flex items-center gap-2 bg-emerald-100/70 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-900">
                <span>Login: <strong>{successBanner.email}</strong></span>
                <span>•</span>
                <span>Password: <strong>{successBanner.password}</strong></span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`Email: ${successBanner.email}\nPassword: ${successBanner.password}`);
                    alert('Partner credentials copied to clipboard!');
                  }}
                  className="hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-sans underline ml-2"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1 cursor-pointer self-start sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-[#F84464]">
              Admin Authority
            </span>
            <span className="text-xs text-gray-400">• Central Cinema Provisioning</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#F84464]" />
            Theater & Partner Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Register new partner theaters, assign cinema manager login credentials, and manage screens.
          </p>
        </div>

        <button
          onClick={() => { setIsRegisterModalOpen(true); setFormError(''); }}
          className="flex items-center gap-2 px-5 py-3 bg-[#F84464] hover:bg-[#d63451] text-white font-bold rounded-xl shadow-md transition-all shadow-[#F84464]/20 cursor-pointer text-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          Register New Theater
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Theaters</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{theaters.length}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-[#F84464]">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner Accounts</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {theaters.filter(t => t.owner).length}
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Showtimes</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {theaters.reduce((sum, t) => sum + (t.stats?.showtimesCount || 0), 0)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cities Covered</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {new Set(theaters.map(t => t.city)).size}
            </h3>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by theater name, city, or partner email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#F84464]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCity('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              selectedCity === 'ALL' ? 'bg-[#F84464] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Cities
          </button>
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCity === city ? 'bg-[#F84464] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Theaters Table / Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <RefreshCw className="w-8 h-8 text-[#F84464] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">Loading theaters directory...</p>
        </div>
      ) : filteredTheaters.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700 text-base">No theaters found</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria or register a new theater.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Theater & Location</th>
                  <th className="py-4 px-6">City</th>
                  <th className="py-4 px-6">Assigned Partner / Owner</th>
                  <th className="py-4 px-6">Amenities</th>
                  <th className="py-4 px-6">Showtimes</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTheaters.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Theater Name & Address */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900 text-base">{t.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {t.location || `${t.name}, ${t.city}`}
                      </div>
                      {t.cancellable && (
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                          Cancellable
                        </span>
                      )}
                    </td>

                    {/* City */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-semibold text-xs">
                        {t.city}
                      </span>
                    </td>

                    {/* Assigned Owner / Partner */}
                    <td className="py-4 px-6">
                      {t.owner ? (
                        <div>
                          <div className="font-semibold text-gray-800">{t.owner.name}</div>
                          <div className="text-xs text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                            {t.owner.email}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                              Partner Active
                            </span>
                            <button
                              onClick={() => { setPasswordModalTheater(t); setNewPassword(''); }}
                              title="Reset Partner Password"
                              className="text-[11px] text-gray-500 hover:text-[#F84464] flex items-center gap-0.5 cursor-pointer underline"
                            >
                              <Key className="w-3 h-3" /> Reset Pwd
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                          ⚠️ No Partner Assigned
                        </div>
                      )}
                    </td>

                    {/* Amenities */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(t.amenities || []).map((amenity, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Showtimes Count */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-800">
                        {t.stats?.showtimesCount || 0} shows
                      </div>
                      <div className="text-xs text-gray-400">
                        {t.stats?.bookingsCount || 0} bookings
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(t)}
                          title="Edit Theater Details"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTheater(t._id, t.name)}
                          title="Delete Theater"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: REGISTER NEW THEATER (ADMIN AUTHORIZED)         */}
      {/* ======================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-[#F84464]">
                  Admin Action
                </span>
                <h3 className="text-xl font-black text-gray-900 mt-1 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#F84464]" />
                  Register New Cinema Theater
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Onboard theater onto QuickShow and create its partner login credentials.
                </p>
              </div>
              <button 
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleRegisterTheater} className="p-6 space-y-6">
              
              {/* Section 1: Cinema Details */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                  Step 1: Cinema & Auditorium Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Theater Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Theater Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., PVR: Forum Sujana Mall, Kukatpally"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      City *
                    </label>
                    <select
                      value={registerForm.city}
                      onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464] bg-white cursor-pointer"
                    >
                      {CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location / Address */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Location / Neighborhood
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Kukatpally, Hyderabad"
                      value={registerForm.location}
                      onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                    />
                  </div>

                  {/* Cancellation Policy */}
                  <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="cancellable_check"
                      checked={registerForm.cancellable}
                      onChange={(e) => setRegisterForm({ ...registerForm, cancellable: e.target.checked })}
                      className="w-4 h-4 text-[#F84464] accent-[#F84464] rounded cursor-pointer"
                    />
                    <label htmlFor="cancellable_check" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Allow Ticket Cancellation up to 20 minutes prior to showtime
                    </label>
                  </div>

                  {/* Amenities Selection */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Available Amenities & Features
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {POPULAR_AMENITIES.map((amenity) => {
                        const isChecked = registerForm.amenities.includes(amenity);
                        return (
                          <button
                            type="button"
                            key={amenity}
                            onClick={() => toggleAmenity(amenity)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all cursor-pointer flex items-center justify-between ${
                              isChecked 
                                ? 'bg-rose-50 border-[#F84464] text-[#F84464]' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <span>{amenity}</span>
                            {isChecked && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 2: Assigned Theater Partner Account */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                    Step 2: Provision Partner Login Credentials
                  </h4>
                </div>
                
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                  <p className="text-xs text-blue-800 font-medium">
                    The theater owner will use these credentials to log in at <strong>/partner/login</strong> to adjust ticket prices and publish movies in real-time.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Partner Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Manager / Owner Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Rajesh Verma"
                      value={registerForm.ownerName}
                      onChange={(e) => setRegisterForm({ ...registerForm, ownerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                    />
                  </div>

                  {/* Partner Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Partner Login Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., owner@pvrcinemas.com"
                      value={registerForm.ownerEmail}
                      onChange={(e) => setRegisterForm({ ...registerForm, ownerEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                    />
                  </div>

                  {/* Partner Password */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Initial Access Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={registerForm.ownerPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, ownerPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                    />
                  </div>

                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#F84464] hover:bg-[#d63451] text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Registering Theater...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Complete Theater Registration
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT THEATER DETAILS                            */}
      {/* ======================================================== */}
      {editingTheater && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Theater Details
              </h3>
              <button onClick={() => setEditingTheater(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTheater} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Theater Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <select
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                  >
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_AMENITIES.map(amenity => {
                    const active = editForm.amenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => toggleEditAmenity(amenity)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                          active ? 'bg-rose-50 border-[#F84464] text-[#F84464]' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit_cancellable"
                  checked={editForm.cancellable}
                  onChange={(e) => setEditForm({ ...editForm, cancellable: e.target.checked })}
                  className="w-4 h-4 text-[#F84464] accent-[#F84464] rounded cursor-pointer"
                />
                <label htmlFor="edit_cancellable" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Cancellation Available
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTheater(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RESET PARTNER PASSWORD                          */}
      {/* ======================================================== */}
      {passwordModalTheater && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#F84464]" />
                Reset Partner Password
              </h3>
              <button onClick={() => setPasswordModalTheater(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Set a new login password for <strong>{passwordModalTheater.owner?.email}</strong> ({passwordModalTheater.name}).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter at least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F84464]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalTheater(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordResetting}
                  className="px-5 py-2 bg-[#F84464] hover:bg-[#d63451] text-white font-bold rounded-xl text-sm cursor-pointer disabled:opacity-50"
                >
                  {passwordResetting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTheaters;
