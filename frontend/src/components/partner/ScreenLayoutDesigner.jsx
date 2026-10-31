import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Armchair, 
  Layers, 
  Tv, 
  RotateCcw, 
  AlertCircle, 
  Save, 
  Sliders, 
  Plus, 
  Minus,
  CheckCircle2,
  Info
} from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

const ScreenLayoutDesigner = ({ theater, onLayoutSaved }) => {
  const token = localStorage.getItem('partner_token');
  const screens = useMemo(() => {
    if (theater?.screens && theater.screens.length > 0) {
      return theater.screens;
    }
    return theater?.theaterType === 'single_screen'
      ? [{ screenNumber: 1, name: 'Main Screen', screenType: 'Dolby Atmos', capacity: 250 }]
      : [
          { screenNumber: 1, name: 'Audi 1', screenType: 'IMAX 4K Laser', capacity: 280 },
          { screenNumber: 2, name: 'Audi 2', screenType: 'Dolby Atmos', capacity: 200 },
          { screenNumber: 3, name: 'Audi 3', screenType: 'Standard 2D', capacity: 150 }
        ];
  }, [theater]);

  // Selected screen
  const [selectedScreenNumber, setSelectedScreenNumber] = useState(screens[0]?.screenNumber || 1);

  const selectedScreen = useMemo(() => {
    return screens.find(s => s.screenNumber === selectedScreenNumber) || screens[0];
  }, [screens, selectedScreenNumber]);

  // Grid dimensions
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(12);

  // Set of deleted seat IDs (e.g. 'A5', 'B6') which form aisles / walkways
  const [deletedSeats, setDeletedSeats] = useState(new Set());

  // Row to Seat Category Mapping: { [rowLabel]: 'recliner' | 'premium' | 'classic' }
  const [rowTiers, setRowTiers] = useState({});

  // Status banners & loading
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Helper to generate balanced default tier distribution
  const generateDefaultTiers = (numRows) => {
    const map = {};
    const labels = Array.from({ length: numRows }, (_, i) => String.fromCharCode(65 + i));
    const reclinerEnd = Math.max(1, Math.min(2, Math.floor(numRows * 0.25)));
    const primeEnd = Math.max(reclinerEnd + 1, Math.min(numRows, Math.floor(numRows * 0.65)));

    labels.forEach((r, idx) => {
      if (idx < reclinerEnd) map[r] = 'recliner';
      else if (idx < primeEnd) map[r] = 'premium';
      else map[r] = 'classic';
    });
    return map;
  };

  // Load layout from selected screen whenever selectedScreenNumber changes
  useEffect(() => {
    if (!selectedScreen) return;

    if (selectedScreen.layout && selectedScreen.layout.rows && selectedScreen.layout.cols) {
      const l = selectedScreen.layout;
      setRows(l.rows);
      setCols(l.cols);
      setDeletedSeats(new Set(l.deletedSeats || []));

      const currentLabels = (l.rowLabels && l.rowLabels.length === l.rows)
        ? l.rowLabels
        : Array.from({ length: l.rows }, (_, i) => String.fromCharCode(65 + i));

      const recSet = new Set(l.tierConfig?.reclinerRows || []);
      const premSet = new Set(l.tierConfig?.premiumRows || []);
      const execSet = new Set(l.tierConfig?.executiveRows || []);

      const hasConfig = recSet.size > 0 || premSet.size > 0 || execSet.size > 0;
      const initialMap = {};

      if (hasConfig) {
        currentLabels.forEach((r) => {
          if (recSet.has(r)) initialMap[r] = 'recliner';
          else if (premSet.has(r)) initialMap[r] = 'premium';
          else if (execSet.has(r)) initialMap[r] = 'classic';
          else initialMap[r] = 'classic';
        });
      } else {
        Object.assign(initialMap, generateDefaultTiers(l.rows));
      }
      setRowTiers(initialMap);
    } else {
      setRows(8);
      setCols(12);
      setDeletedSeats(new Set());
      setRowTiers(generateDefaultTiers(8));
    }
    setHasUnsavedChanges(false);
    setSuccessBanner('');
    setErrorBanner('');
  }, [selectedScreen]);

  // Computed row labels (A, B, C... up to rows count)
  const rowLabels = useMemo(() => {
    return Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));
  }, [rows]);

  // Computed column numbers (1 to cols)
  const colNumbers = useMemo(() => {
    return Array.from({ length: cols }, (_, i) => i + 1);
  }, [cols]);

  // Helper to get tier for any row
  const getRowTier = (row) => rowTiers[row] || 'classic';

  // Computed tier rows lists
  const reclinerRows = useMemo(() => {
    return rowLabels.filter(r => getRowTier(r) === 'recliner');
  }, [rowLabels, rowTiers]);

  const primeRows = useMemo(() => {
    return rowLabels.filter(r => getRowTier(r) === 'premium');
  }, [rowLabels, rowTiers]);

  const classicRows = useMemo(() => {
    return rowLabels.filter(r => getRowTier(r) === 'classic');
  }, [rowLabels, rowTiers]);

  // Calculate live capacity & stats
  const totalSlots = rows * cols;
  const deletedCount = deletedSeats.size;
  const activeCapacity = Math.max(0, totalSlots - deletedCount);

  // Per-tier active seat counts (excluding deleted aisle seats)
  const reclinerSeatsCount = useMemo(() => {
    return reclinerRows.reduce((acc, row) => {
      return acc + colNumbers.filter(c => !deletedSeats.has(`${row}${c}`)).length;
    }, 0);
  }, [reclinerRows, colNumbers, deletedSeats]);

  const primeSeatsCount = useMemo(() => {
    return primeRows.reduce((acc, row) => {
      return acc + colNumbers.filter(c => !deletedSeats.has(`${row}${c}`)).length;
    }, 0);
  }, [primeRows, colNumbers, deletedSeats]);

  const classicSeatsCount = useMemo(() => {
    return classicRows.reduce((acc, row) => {
      return acc + colNumbers.filter(c => !deletedSeats.has(`${row}${c}`)).length;
    }, 0);
  }, [classicRows, colNumbers, deletedSeats]);

  // Set seat category for a specific row
  const handleSetRowTier = (row, tier) => {
    setRowTiers(prev => ({
      ...prev,
      [row]: tier
    }));
    setHasUnsavedChanges(true);
  };

  // Cycle row category: Recliner -> Prime -> Classic -> Recliner
  const handleCycleRowTier = (row) => {
    const current = getRowTier(row);
    const order = ['recliner', 'premium', 'classic'];
    const nextTier = order[(order.indexOf(current) + 1) % order.length];
    handleSetRowTier(row, nextTier);
  };

  // Bulk tier preset applier
  const handleApplyPresetTiering = (preset) => {
    const updated = {};
    if (preset === 'standard') {
      Object.assign(updated, generateDefaultTiers(rows));
    } else if (preset === 'all_recliner') {
      rowLabels.forEach(r => { updated[r] = 'recliner'; });
    } else if (preset === 'all_prime') {
      rowLabels.forEach(r => { updated[r] = 'premium'; });
    } else if (preset === 'all_classic') {
      rowLabels.forEach(r => { updated[r] = 'classic'; });
    }
    setRowTiers(updated);
    setHasUnsavedChanges(true);
  };

  // Toggle single seat deletion/restoration
  const handleToggleSeat = (seatId) => {
    setDeletedSeats(prev => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId); // Restore seat
      } else {
        next.add(seatId); // Delete seat (turn to aisle/space)
      }
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Toggle entire row of seats
  const handleToggleRow = (row) => {
    const rowSeats = colNumbers.map(c => `${row}${c}`);
    const allDeleted = rowSeats.every(s => deletedSeats.has(s));

    setDeletedSeats(prev => {
      const next = new Set(prev);
      if (allDeleted) {
        rowSeats.forEach(s => next.delete(s));
      } else {
        rowSeats.forEach(s => next.add(s));
      }
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Toggle entire column of seats
  const handleToggleColumn = (col) => {
    const colSeats = rowLabels.map(r => `${r}${col}`);
    const allDeleted = colSeats.every(s => deletedSeats.has(s));

    setDeletedSeats(prev => {
      const next = new Set(prev);
      if (allDeleted) {
        colSeats.forEach(s => next.delete(s));
      } else {
        colSeats.forEach(s => next.add(s));
      }
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Preset: Add Center Walkway Aisle
  const handleAddCenterAisle = () => {
    const centerCol = Math.ceil(cols / 2);
    setDeletedSeats(prev => {
      const next = new Set(prev);
      rowLabels.forEach(r => next.add(`${r}${centerCol}`));
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Preset: Add Dual Side Walkway Aisles
  const handleAddDualAisles = () => {
    if (cols < 7) return;
    const leftAisle = Math.max(2, Math.floor(cols * 0.28));
    const rightAisle = Math.min(cols - 1, Math.ceil(cols * 0.72));
    setDeletedSeats(prev => {
      const next = new Set(prev);
      rowLabels.forEach(r => {
        next.add(`${r}${leftAisle}`);
        next.add(`${r}${rightAisle}`);
      });
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Reset: Clear all deleted seats
  const handleRestoreAllSeats = () => {
    setDeletedSeats(new Set());
    setHasUnsavedChanges(true);
  };

  // Save Layout to Backend
  const handleSaveLayout = async () => {
    setSaving(true);
    setErrorBanner('');
    setSuccessBanner('');

    try {
      const payload = {
        screenNumber: selectedScreen.screenNumber,
        screenName: selectedScreen.name,
        rows,
        cols,
        rowLabels,
        deletedSeats: Array.from(deletedSeats),
        tierConfig: {
          reclinerRows,
          premiumRows: primeRows,
          executiveRows: classicRows
        }
      };

      const res = await axios.put(
        `${API_BASE_URL}/theaters/partner/screens/${selectedScreen.screenNumber}/layout`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessBanner(
        `Layout for "${selectedScreen.name}" saved successfully (${activeCapacity} active seats).`
      );
      setHasUnsavedChanges(false);

      if (onLayoutSaved) {
        onLayoutSaved(res.data.theater, res.data.screen);
      }
    } catch (err) {
      console.error('Failed to save layout:', err);
      setErrorBanner(err.response?.data?.msg || 'Failed to save layout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Helper metadata for tier styling
  const getTierMeta = (tier) => {
    if (tier === 'recliner') {
      return {
        label: 'Recliner',
        tag: 'REC',
        badgeBg: 'bg-amber-900/40 text-amber-300 border-amber-600/50',
        seatBg: 'bg-amber-950/30 border-amber-500/70 text-amber-200 hover:border-amber-400',
        dot: 'bg-amber-400'
      };
    }
    if (tier === 'premium') {
      return {
        label: 'Prime',
        tag: 'PRM',
        badgeBg: 'bg-rose-950/40 text-rose-300 border-rose-600/50',
        seatBg: 'bg-rose-950/30 border-rose-500/70 text-rose-200 hover:border-rose-400',
        dot: 'bg-rose-400'
      };
    }
    return {
      label: 'Classic',
      tag: 'CLS',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      seatBg: 'bg-slate-800/90 border-slate-600 text-slate-200 hover:border-slate-400',
      dot: 'bg-slate-400'
    };
  };

  return (
    <div className="space-y-4 text-slate-900 font-sans">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                <Armchair className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Auditorium Layout Studio</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure grid dimensions, row categories, and walkway aisles for each screen.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Unsaved Changes
              </span>
            )}
            <button
              onClick={handleSaveLayout}
              disabled={saving}
              className="bg-[#F84464] hover:bg-[#d83552] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Screen Tabs (Multiplex vs Single Screen) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {theater?.theaterType === 'single_screen' ? 'Auditorium' : 'Select Screen'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {screens.map((sc, idx) => {
              const isSelected = sc.screenNumber === selectedScreenNumber;
              const hasCustom = Boolean(sc.layout?.rows && sc.layout?.cols);

              return (
                <button
                  key={sc.screenNumber || idx}
                  onClick={() => setSelectedScreenNumber(sc.screenNumber)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border text-left ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{sc.name}</span>
                  <span className={`text-[10px] font-normal ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    ({sc.screenType || 'Standard'})
                  </span>
                  <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded ml-1 ${
                    hasCustom 
                      ? (isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                      : (isSelected ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500')
                  }`}>
                    {hasCustom ? 'Configured' : 'Default'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="flex-1">{successBanner}</span>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800 font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="flex-1">{errorBanner}</span>
          <button onClick={() => setErrorBanner('')} className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Studio Controls Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Controls: Dimensions & Presets */}
          <div className="flex flex-wrap items-center gap-5">
            
            {/* Dimensions */}
            <div className="flex items-center gap-4 border-r border-slate-200 pr-5">
              {/* Rows */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rows</span>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      if (rows > 2) {
                        setRows(rows - 1);
                        setHasUnsavedChanges(true);
                      }
                    }}
                    disabled={rows <= 2}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900">
                    {rows}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (rows < 26) {
                        setRows(rows + 1);
                        setHasUnsavedChanges(true);
                      }
                    }}
                    disabled={rows >= 26}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Columns */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cols</span>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      if (cols > 4) {
                        setCols(cols - 1);
                        setHasUnsavedChanges(true);
                      }
                    }}
                    disabled={cols <= 4}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900">
                    {cols}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (cols < 30) {
                        setCols(cols + 1);
                        setHasUnsavedChanges(true);
                      }
                    }}
                    disabled={cols >= 30}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Aisle Generators */}
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Aisles:</span>
              <button
                type="button"
                onClick={handleAddCenterAisle}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                Center Walkway
              </button>
              <button
                type="button"
                onClick={handleAddDualAisles}
                disabled={cols < 7}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
              >
                Dual Aisles
              </button>
              <button
                type="button"
                onClick={handleRestoreAllSeats}
                disabled={deletedCount === 0}
                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Aisles</span>
              </button>
            </div>

            {/* Category Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Tiers:</span>
              <button
                type="button"
                onClick={() => handleApplyPresetTiering('standard')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                title="Top rows Recliner, middle rows Prime, back rows Classic"
              >
                Standard Mix
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetTiering('all_classic')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                All Classic
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetTiering('all_recliner')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                VIP (All Recliner)
              </button>
            </div>

          </div>

          {/* HUD Inventory Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">Total:</span>{' '}
              <strong className="text-slate-900 font-bold">{activeCapacity}</strong>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-600">Recliner:</span>{' '}
              <strong className="text-slate-900 font-bold">{reclinerSeatsCount}</strong>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-600">Prime:</span>{' '}
              <strong className="text-slate-900 font-bold">{primeSeatsCount}</strong>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-slate-600">Classic:</span>{' '}
              <strong className="text-slate-900 font-bold">{classicSeatsCount}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Cinema Blueprint Seating Canvas */}
      <div className="bg-[#0F172A] rounded-xl border border-slate-800 shadow-md p-6 overflow-hidden text-slate-100">
        
        {/* Curved Screen Indicator */}
        <div className="w-full flex flex-col items-center pt-2 mb-6">
          <div className="relative w-full max-w-xl flex justify-center">
            <svg className="w-full h-8" viewBox="0 0 500 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueprintScreenGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path
                d="M 20 34 Q 250 8 480 34"
                fill="transparent"
                stroke="url(#blueprintScreenGlow)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.35em] text-slate-400 mt-0.5">
            SCREEN
          </span>
        </div>

        {/* Scrollable Seating Canvas */}
        <div className="overflow-x-auto py-4 flex flex-col items-center">
          
          {/* Top Column Numbers */}
          <div className="flex items-center justify-center gap-1.5 mb-2.5">
            <div className="w-24 text-right pr-2 text-[10px] font-mono text-slate-500 font-semibold uppercase">
              Row
            </div>
            <div className="flex gap-1.5">
              {colNumbers.map((col) => (
                <button
                  key={`col-hdr-${col}`}
                  type="button"
                  onClick={() => handleToggleColumn(col)}
                  className="w-7 h-6 sm:w-8 sm:h-6 text-[10px] font-mono font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center justify-center transition-colors cursor-pointer"
                  title={`Toggle Column ${col}`}
                >
                  {col}
                </button>
              ))}
            </div>
            <div className="w-12 text-left pl-2 text-[10px] font-mono text-slate-500 font-semibold uppercase">
              Row
            </div>
          </div>

          {/* Seat Grid Rows */}
          <div className="space-y-1.5">
            {rowLabels.map((row) => {
              const tier = getRowTier(row);
              const meta = getTierMeta(tier);

              return (
                <div key={row} className="flex items-center justify-center gap-1.5">
                  
                  {/* Left Controls: Row Letter & Interactive Category Pill */}
                  <div className="w-24 flex items-center justify-end gap-1.5 pr-2">
                    <button
                      type="button"
                      onClick={() => handleToggleRow(row)}
                      className="w-5 h-7 text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center justify-center transition-colors cursor-pointer"
                      title={`Toggle Row ${row}`}
                    >
                      {row}
                    </button>
                    
                    {/* Clickable Tier Pill: switches category */}
                    <button
                      type="button"
                      onClick={() => handleCycleRowTier(row)}
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${meta.badgeBg}`}
                      title={`Row ${row}: ${meta.label}. Click to switch category.`}
                    >
                      {meta.tag}
                    </button>
                  </div>

                  {/* Seat Cells */}
                  <div className="flex gap-1.5">
                    {colNumbers.map((col) => {
                      const seatId = `${row}${col}`;
                      const isDeleted = deletedSeats.has(seatId);

                      if (isDeleted) {
                        return (
                          <button
                            key={seatId}
                            type="button"
                            onClick={() => handleToggleSeat(seatId)}
                            className={`border border-dashed border-slate-700/60 bg-transparent hover:bg-slate-800/80 hover:border-slate-500 rounded flex items-center justify-center cursor-pointer transition-colors group ${
                              tier === 'recliner' ? 'w-9 sm:w-10 h-7 sm:h-8' : 'w-7 sm:w-8 h-7 sm:h-8'
                            }`}
                            title={`Aisle Space (${seatId}) - Click to restore`}
                          >
                            <span className="text-[10px] text-slate-600 group-hover:text-slate-300 font-mono">
                              &middot;
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={seatId}
                          type="button"
                          onClick={() => handleToggleSeat(seatId)}
                          className={`rounded border text-[11px] font-mono font-medium transition-all relative flex items-center justify-center cursor-pointer group active:scale-95 ${meta.seatBg} ${
                            tier === 'recliner' ? 'w-9 sm:w-10 h-7 sm:h-8' : 'w-7 sm:w-8 h-7 sm:h-8'
                          }`}
                          title={`Seat ${seatId} (${meta.label}) - Click to delete`}
                        >
                          <span className="group-hover:hidden">
                            {col}
                          </span>
                          <span className="hidden group-hover:block text-rose-400 font-bold text-xs">
                            &times;
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Control: Row Letter */}
                  <div className="w-12 text-left pl-2">
                    <button
                      type="button"
                      onClick={() => handleToggleRow(row)}
                      className="w-5 h-7 text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded flex items-center justify-center transition-colors cursor-pointer"
                      title={`Toggle Row ${row}`}
                    >
                      {row}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Bottom Column Numbers */}
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            <div className="w-24 text-right pr-2 text-[10px] font-mono text-slate-500 font-semibold uppercase">
              Row
            </div>
            <div className="flex gap-1.5">
              {colNumbers.map((col) => (
                <span
                  key={`col-ftr-${col}`}
                  className="w-7 h-5 sm:w-8 sm:h-5 text-[10px] font-mono text-slate-500 flex items-center justify-center"
                >
                  {col}
                </span>
              ))}
            </div>
            <div className="w-12 text-left pl-2 text-[10px] font-mono text-slate-500 font-semibold uppercase">
              Row
            </div>
          </div>

        </div>

        {/* Clean Blueprint Legend & Tips */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-amber-500/70 bg-amber-950/40"></span>
              <span className="text-slate-300">Recliner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-rose-500/70 bg-rose-950/40"></span>
              <span className="text-slate-300">Prime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-slate-600 bg-slate-800"></span>
              <span className="text-slate-300">Classic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-dashed border-slate-700 bg-transparent flex items-center justify-center text-[10px]">
                &middot;
              </span>
              <span className="text-slate-400">Aisle Space</span>
            </div>
          </div>

          <div className="text-slate-500 text-[10px] font-medium">
            Tip: Click seat to toggle aisle walkway &bull; Click row tag (REC/PRM/CLS) to change tier
          </div>
        </div>

      </div>

    </div>
  );
};

export default ScreenLayoutDesigner;
