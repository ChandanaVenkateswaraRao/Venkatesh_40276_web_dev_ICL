import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../api/config';
import { 
  Building2, Plus, Search, MapPin, ShieldCheck, Key, Edit2, Trash2, 
  CheckCircle, X, AlertCircle, Copy, ExternalLink, Ticket, Users, RefreshCw,
  Layers, Tv, Minus, Film
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

const SCREEN_TYPES = [
  'Standard 2D',
  'Dolby Atmos',
  'IMAX 4K Laser',
  '4DX 3D',
  'INSIGNIA / Gold Class Recliner',
  '4K Barco Laser',
  'Onyx Cinema LED',
  'ScreenX (270° Panoramic)'
];

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
    theaterType: 'multiplex', // 'single_screen' | 'multiplex'
    screens: [
      { screenNumber: 1, name: 'Audi 1', screenType: 'Dolby Atmos', capacity: 200 },
      { screenNumber: 2, name: 'Audi 2', screenType: '4K Barco Laser', capacity: 180 },
      { screenNumber: 3, name: 'Audi 3', screenType: 'IMAX 4K Laser', capacity: 250 }
    ],
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
    theaterType: 'multiplex',
    screens: [],
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
      const res = await axios.get(`${API_BASE_URL}/admin/theaters`);
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

  // Handle theater type switch in registration
  const handleRegisterTypeChange = (type) => {
    if (type === 'single_screen') {
      setRegisterForm(prev => ({
        ...prev,
        theaterType: 'single_screen',
        screens: [
          {
            screenNumber: 1,
            name: prev.screens[0]?.name || 'Main Screen',
            screenType: prev.screens[0]?.screenType || 'Dolby Atmos',
            capacity: prev.screens[0]?.capacity || 250
          }
        ]
      }));
    } else {
      setRegisterForm(prev => {
        let currentScreens = prev.screens;
        if (!currentScreens || currentScreens.length <= 1) {
          currentScreens = [
            { screenNumber: 1, name: 'Audi 1', screenType: 'Dolby Atmos', capacity: 200 },
            { screenNumber: 2, name: 'Audi 2', screenType: '4K Barco Laser', capacity: 180 },
            { screenNumber: 3, name: 'Audi 3', screenType: 'IMAX 4K Laser', capacity: 250 }
          ];
        }
        return {
          ...prev,
          theaterType: 'multiplex',
          screens: currentScreens
        };
      });
    }
  };

  // Set number of screens for multiplex
  const handleRegisterScreenCountChange = (count) => {
    const num = Math.max(2, Math.min(20, parseInt(count) || 2));
    setRegisterForm(prev => {
      const current = [...(prev.screens || [])];
      if (current.length < num) {
        for (let i = current.length + 1; i <= num; i++) {
          current.push({
            screenNumber: i,
            name: `Audi ${i}`,
            screenType: SCREEN_TYPES[(i - 1) % SCREEN_TYPES.length],
            capacity: 200
          });
        }
      } else if (current.length > num) {
        current.splice(num);
      }
      return { ...prev, screens: current };
    });
  };

  // Update specific screen in register form
  const updateRegisterScreen = (index, field, value) => {
    setRegisterForm(prev => {
      const updated = [...prev.screens];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, screens: updated };
    });
  };

  // Add a screen to register form
  const addRegisterScreen = () => {
    setRegisterForm(prev => {
      const nextNum = (prev.screens?.length || 0) + 1;
      return {
        ...prev,
        screens: [
          ...(prev.screens || []),
          {
            screenNumber: nextNum,
            name: `Audi ${nextNum}`,
            screenType: SCREEN_TYPES[(nextNum - 1) % SCREEN_TYPES.length],
            capacity: 200
          }
        ]
      };
    });
  };

  // Remove screen from register form
  const removeRegisterScreen = (index) => {
    setRegisterForm(prev => {
      if (prev.screens.length <= 2) {
        alert('A multiplex must have at least 2 screens. Switch to Single Screen if this is a single auditorium cinema.');
        return prev;
      }
      const updated = prev.screens.filter((_, i) => i !== index).map((s, i) => ({
        ...s,
        screenNumber: i + 1
      }));
      return { ...prev, screens: updated };
    });
  };

  // Handle edit theater type switch
  const handleEditTypeChange = (type) => {
    if (type === 'single_screen') {
      setEditForm(prev => ({
        ...prev,
        theaterType: 'single_screen',
        screens: [
          {
            screenNumber: 1,
            name: prev.screens[0]?.name || 'Main Screen',
            screenType: prev.screens[0]?.screenType || 'Dolby Atmos',
            capacity: prev.screens[0]?.capacity || 250
          }
        ]
      }));
    } else {
      setEditForm(prev => {
        let currentScreens = prev.screens;
        if (!currentScreens || currentScreens.length <= 1) {
          currentScreens = [
            { screenNumber: 1, name: 'Audi 1', screenType: 'Dolby Atmos', capacity: 200 },
            { screenNumber: 2, name: 'Audi 2', screenType: '4K Barco Laser', capacity: 180 },
            { screenNumber: 3, name: 'Audi 3', screenType: 'IMAX 4K Laser', capacity: 250 }
          ];
        }
        return {
          ...prev,
          theaterType: 'multiplex',
          screens: currentScreens
        };
      });
    }
  };

  const handleEditScreenCountChange = (count) => {
    const num = Math.max(2, Math.min(20, parseInt(count) || 2));
    setEditForm(prev => {
      const current = [...(prev.screens || [])];
      if (current.length < num) {
        for (let i = current.length + 1; i <= num; i++) {
          current.push({
            screenNumber: i,
            name: `Audi ${i}`,
            screenType: SCREEN_TYPES[(i - 1) % SCREEN_TYPES.length],
            capacity: 200
          });
        }
      } else if (current.length > num) {
        current.splice(num);
      }
      return { ...prev, screens: current };
    });
  };

  const updateEditScreen = (index, field, value) => {
    setEditForm(prev => {
      const updated = [...prev.screens];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, screens: updated };
    });
  };

  const addEditScreen = () => {
    setEditForm(prev => {
      const nextNum = (prev.screens?.length || 0) + 1;
      return {
        ...prev,
        screens: [
          ...(prev.screens || []),
          {
            screenNumber: nextNum,
            name: `Audi ${nextNum}`,
            screenType: SCREEN_TYPES[(nextNum - 1) % SCREEN_TYPES.length],
            capacity: 200
          }
        ]
      };
    });
  };

  const removeEditScreen = (index) => {
    setEditForm(prev => {
      if (prev.screens.length <= 2) {
        alert('A multiplex must have at least 2 screens.');
        return prev;
      }
      const updated = prev.screens.filter((_, i) => i !== index).map((s, i) => ({
        ...s,
        screenNumber: i + 1
      }));
      return { ...prev, screens: updated };
    });
  };

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
      const res = await axios.post(`${API_BASE_URL}/admin/theaters`, registerForm);
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
        theaterType: 'multiplex',
        screens: [
          { screenNumber: 1, name: 'Audi 1', screenType: 'Dolby Atmos', capacity: 200 },
          { screenNumber: 2, name: 'Audi 2', screenType: '4K Barco Laser', capacity: 180 },
          { screenNumber: 3, name: 'Audi 3', screenType: 'IMAX 4K Laser', capacity: 250 }
        ],
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
      await axios.put(`${API_BASE_URL}/admin/theaters/${editingTheater._id}`, editForm);
      setEditingTheater(null);
      fetchTheaters();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update theater');
    }
  };

  // Open Edit Modal
  const openEditModal = (th) => {
    setEditingTheater(th);
    const existingType = th.theaterType || (th.screens && th.screens.length === 1 ? 'single_screen' : 'multiplex');
    const existingScreens = (th.screens && th.screens.length > 0)
      ? th.screens.map(s => ({
          screenNumber: s.screenNumber,
          name: s.name,
          screenType: s.screenType || 'Standard 2D',
          capacity: s.capacity || 200
        }))
      : (existingType === 'single_screen'
          ? [{ screenNumber: 1, name: 'Main Screen', screenType: 'Dolby Atmos', capacity: 250 }]
          : [
              { screenNumber: 1, name: 'Audi 1', screenType: 'Dolby Atmos', capacity: 200 },
              { screenNumber: 2, name: 'Audi 2', screenType: '4K Barco Laser', capacity: 180 },
              { screenNumber: 3, name: 'Audi 3', screenType: 'IMAX 4K Laser', capacity: 250 }
            ]);

    setEditForm({
      name: th.name,
      city: th.city,
      location: th.location || '',
      theaterType: existingType,
      screens: existingScreens,
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
      await axios.post(`${API_BASE_URL}/admin/theaters/${passwordModalTheater._id}/reset-password`, {
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
      await axios.delete(`${API_BASE_URL}/admin/theaters/${id}`);
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
                  <th className="py-4 px-6">Screens & Formats</th>
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
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {t.theaterType === 'single_screen' || (t.screens && t.screens.length === 1) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                            <Tv className="w-3 h-3" /> Single Screen
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                            <Layers className="w-3 h-3" /> Multiplex ({t.screens?.length || 3} Screens)
                          </span>
                        )}
                        {t.cancellable && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                            Cancellable
                          </span>
                        )}
                      </div>
                    </td>

                    {/* City */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-semibold text-xs">
                        {t.city}
                      </span>
                    </td>

                    {/* Screens & Formats */}
                    <td className="py-4 px-6">
                      {t.theaterType === 'single_screen' || (t.screens && t.screens.length === 1) ? (
                        <div className="space-y-1">
                          <span className="inline-block text-[11px] font-bold text-gray-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {t.screens?.[0]?.name || 'Main Screen'}
                          </span>
                          <div className="text-[11px] text-gray-500">
                            <strong className="text-gray-700">{t.screens?.[0]?.screenType || 'Dolby Atmos'}</strong> • {t.screens?.[0]?.capacity || 250} seats
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-w-xs">
                          <div className="text-[11px] font-bold text-gray-700">
                            {t.screens?.length || 0} Configured Audis:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(t.screens || []).map((s, idx) => (
                              <span 
                                key={idx}
                                className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded"
                                title={`${s.name} (${s.screenType} • ${s.capacity} seats)`}
                              >
                                <strong>{s.name}</strong>: {s.screenType}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
                        <div className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 font-medium border border-amber-200/60">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>No Partner Assigned</span>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            
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
                  Onboard theater onto bookmyshow, configure auditorium screens, and create its partner login credentials.
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

                  {/* Theater Type Selector */}
                  <div className="sm:col-span-2 pt-2 pb-1 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Theater Format & Architecture *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Option 1: Single Screen */}
                      <div 
                        onClick={() => handleRegisterTypeChange('single_screen')}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          registerForm.theaterType === 'single_screen'
                            ? 'border-[#F84464] bg-rose-50/60 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          registerForm.theaterType === 'single_screen'
                            ? 'bg-[#F84464] text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Tv className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900">Single Screen Cinema</span>
                            <input 
                              type="radio" 
                              name="register_theater_type" 
                              checked={registerForm.theaterType === 'single_screen'} 
                              onChange={() => handleRegisterTypeChange('single_screen')}
                              className="accent-[#F84464] cursor-pointer"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Standalone single auditorium hall with 1 primary screen.
                          </p>
                        </div>
                      </div>

                      {/* Option 2: Multiplex */}
                      <div 
                        onClick={() => handleRegisterTypeChange('multiplex')}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          registerForm.theaterType === 'multiplex'
                            ? 'border-[#F84464] bg-rose-50/60 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          registerForm.theaterType === 'multiplex'
                            ? 'bg-[#F84464] text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900">Multiplex Cinema</span>
                            <input 
                              type="radio" 
                              name="register_theater_type" 
                              checked={registerForm.theaterType === 'multiplex'} 
                              onChange={() => handleRegisterTypeChange('multiplex')}
                              className="accent-[#F84464] cursor-pointer"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Multi-screen entertainment complex with multiple distinct screens.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Conditional Screen Configurations */}
                  {registerForm.theaterType === 'single_screen' ? (
                    /* Single Screen Config */
                    <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                          <Tv className="w-4 h-4 text-[#F84464]" />
                          Single Auditorium Screen Setup
                        </span>
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          1 Auditorium
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Screen / Hall Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={registerForm.screens[0]?.name || ''}
                            onChange={(e) => updateRegisterScreen(0, 'name', e.target.value)}
                            placeholder="e.g., Main Screen"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Projection & Sound Type *
                          </label>
                          <select
                            value={registerForm.screens[0]?.screenType || 'Dolby Atmos'}
                            onChange={(e) => updateRegisterScreen(0, 'screenType', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464] cursor-pointer"
                          >
                            {SCREEN_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Seating Capacity *
                          </label>
                          <input
                            type="number"
                            required
                            min="50"
                            max="3000"
                            value={registerForm.screens[0]?.capacity || 250}
                            onChange={(e) => updateRegisterScreen(0, 'capacity', parseInt(e.target.value) || 250)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Multiplex Config */
                    <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#F84464]" />
                            Multiplex Screens Setup ({registerForm.screens?.length || 0} Screens)
                          </span>
                          <p className="text-[11px] text-gray-500">
                            Specify number of screens and customize each auditorium's name, projection format, and capacity.
                          </p>
                        </div>

                        {/* Screen Count Quick Stepper */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200 self-start sm:self-auto">
                          <span className="text-[11px] font-bold text-gray-500 px-2">Total Screens:</span>
                          <button
                            type="button"
                            onClick={() => handleRegisterScreenCountChange((registerForm.screens?.length || 2) - 1)}
                            disabled={(registerForm.screens?.length || 2) <= 2}
                            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold disabled:opacity-40 cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black text-gray-900">
                            {registerForm.screens?.length || 2}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRegisterScreenCountChange((registerForm.screens?.length || 2) + 1)}
                            disabled={(registerForm.screens?.length || 2) >= 15}
                            className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold disabled:opacity-40 cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Quick Screen Count Badges */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <span className="text-[10px] font-bold uppercase text-gray-400">Presets:</span>
                        {[2, 3, 4, 5, 6, 8].map(count => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => handleRegisterScreenCountChange(count)}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              registerForm.screens?.length === count
                                ? 'bg-[#F84464] text-white shadow-xs'
                                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {count} Screens
                          </button>
                        ))}
                      </div>

                      {/* List of screens */}
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {registerForm.screens.map((screen, index) => (
                          <div 
                            key={index} 
                            className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                          >
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="w-6 h-6 rounded-full bg-rose-50 text-[#F84464] font-bold text-xs flex items-center justify-center border border-rose-100">
                                {index + 1}
                              </span>
                              <span className="text-xs font-bold text-gray-800 hidden sm:inline">
                                Screen {index + 1}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                              <div>
                                <input
                                  type="text"
                                  required
                                  value={screen.name}
                                  onChange={(e) => updateRegisterScreen(index, 'name', e.target.value)}
                                  placeholder={`e.g. Audi ${index + 1}`}
                                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464]"
                                />
                              </div>

                              <div>
                                <select
                                  value={screen.screenType}
                                  onChange={(e) => updateRegisterScreen(index, 'screenType', e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464] bg-white cursor-pointer"
                                >
                                  {SCREEN_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  required
                                  min="30"
                                  max="1500"
                                  value={screen.capacity}
                                  onChange={(e) => updateRegisterScreen(index, 'capacity', parseInt(e.target.value) || 200)}
                                  placeholder="Capacity"
                                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#F84464]"
                                  title="Seating Capacity"
                                />
                                <span className="text-[10px] text-gray-400 font-semibold shrink-0">seats</span>
                              </div>
                            </div>

                            {registerForm.screens.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeRegisterScreen(index)}
                                title="Remove Screen"
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add another screen button */}
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={addRegisterScreen}
                          className="flex items-center gap-1 text-xs font-bold text-[#F84464] hover:text-[#d63451] hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Another Screen to Multiplex
                        </button>
                      </div>
                    </div>
                  )}

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
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  Edit Theater & Screens Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update theater properties, auditorium screens, formats, and amenities.
                </p>
              </div>
              <button onClick={() => setEditingTheater(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTheater} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Theater Name *</label>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
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

              {/* Theater Type Selector in Edit */}
              <div className="pt-2 pb-1 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Theater Format & Architecture *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Single Screen */}
                  <div 
                    onClick={() => handleEditTypeChange('single_screen')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      editForm.theaterType === 'single_screen'
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${
                      editForm.theaterType === 'single_screen'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Tv className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900">Single Screen Cinema</span>
                        <input 
                          type="radio" 
                          name="edit_theater_type" 
                          checked={editForm.theaterType === 'single_screen'} 
                          onChange={() => handleEditTypeChange('single_screen')}
                          className="accent-blue-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Single auditorium cinema hall.
                      </p>
                    </div>
                  </div>

                  {/* Multiplex */}
                  <div 
                    onClick={() => handleEditTypeChange('multiplex')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      editForm.theaterType === 'multiplex'
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${
                      editForm.theaterType === 'multiplex'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900">Multiplex Cinema</span>
                        <input 
                          type="radio" 
                          name="edit_theater_type" 
                          checked={editForm.theaterType === 'multiplex'} 
                          onChange={() => handleEditTypeChange('multiplex')}
                          className="accent-blue-600 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Multiple screens / auditoriums.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Edit Screens Setup */}
              {editForm.theaterType === 'single_screen' ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-blue-600" />
                      Single Screen Settings
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Screen Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.screens?.[0]?.name || ''}
                        onChange={(e) => updateEditScreen(0, 'name', e.target.value)}
                        placeholder="e.g., Main Screen"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Screen Type *</label>
                      <select
                        value={editForm.screens?.[0]?.screenType || 'Dolby Atmos'}
                        onChange={(e) => updateEditScreen(0, 'screenType', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      >
                        {SCREEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Capacity *</label>
                      <input
                        type="number"
                        required
                        min="50"
                        max="3000"
                        value={editForm.screens?.[0]?.capacity || 250}
                        onChange={(e) => updateEditScreen(0, 'capacity', parseInt(e.target.value) || 250)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      Multiplex Screens ({editForm.screens?.length || 0})
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditScreenCountChange((editForm.screens?.length || 2) - 1)}
                        disabled={(editForm.screens?.length || 2) <= 2}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs font-bold disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold px-1.5">{editForm.screens?.length || 2}</span>
                      <button
                        type="button"
                        onClick={() => handleEditScreenCountChange((editForm.screens?.length || 2) + 1)}
                        disabled={(editForm.screens?.length || 2) >= 15}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-xs font-bold disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {(editForm.screens || []).map((screen, index) => (
                      <div key={index} className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={screen.name}
                          onChange={(e) => updateEditScreen(index, 'name', e.target.value)}
                          placeholder={`Screen ${index + 1}`}
                          className="w-1/3 px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                        <select
                          value={screen.screenType}
                          onChange={(e) => updateEditScreen(index, 'screenType', e.target.value)}
                          className="w-1/3 px-2 py-1 border border-gray-200 rounded text-xs bg-white"
                        >
                          {SCREEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input
                          type="number"
                          required
                          min="30"
                          max="1500"
                          value={screen.capacity}
                          onChange={(e) => updateEditScreen(index, 'capacity', parseInt(e.target.value) || 200)}
                          placeholder="Capacity"
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                        {(editForm.screens?.length || 0) > 2 && (
                          <button
                            type="button"
                            onClick={() => removeEditScreen(index)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={addEditScreen}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Screen
                    </button>
                  </div>
                </div>
              )}

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
