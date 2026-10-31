import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Armchair, 
  Layers, 
  Tv, 
  Trash2, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Save, 
  Sparkles, 
  Sliders, 
  Eye, 
  Plus, 
  Minus,
  CheckCircle2,
  Info,
  Maximize2,
  Crown,
  Star,
  Ticket
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

  // Set of deleted seat IDs, e.g. 'A5', 'B6'
  const [deletedSeats, setDeletedSeats] = useState(new Set());

  // Row to Seat Type Mapping: { [rowLabel]: 'recliner' | 'premium' | 'classic' }
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

      // Calculate tier map from tierConfig
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
      // Sensible default layout: 8 rows x 12 cols
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

  // Set seat type for a specific row
  const handleSetRowTier = (row, tier) => {
    setRowTiers(prev => ({
      ...prev,
      [row]: tier
    }));
    setHasUnsavedChanges(true);
  };

  // Cycle row tier: Recliner -> Prime -> Classic -> Recliner
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
    } else if (preset === 'recliner_and_prime') {
      const half = Math.ceil(rows / 2);
      rowLabels.forEach((r, i) => {
        updated[r] = i < half ? 'recliner' : 'premium';
      });
    } else if (preset === 'prime_and_classic') {
      const half = Math.ceil(rows / 2);
      rowLabels.forEach((r, i) => {
        updated[r] = i < half ? 'premium' : 'classic';
      });
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
        `Layout for "${selectedScreen.name}" saved successfully with ${activeCapacity} active seats (${reclinerSeatsCount} Recliners, ${primeSeatsCount} Prime/Exec, ${classicSeatsCount} Classic/Normal)!`
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

  // Helper to determine styling and metadata for any row tier
  const getRowTierInfo = (row) => {
    const tier = getRowTier(row);
    if (tier === 'recliner') {
      return {
        tier: 'recliner',
        name: 'Royal Recliner Lounge',
        shortName: 'Recliner',
        tag: '👑 Recliner',
        color: 'text-amber-800',
        borderColor: 'border-amber-400',
        bg: 'bg-amber-50',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        seatClasses: 'bg-amber-50 border-amber-400 text-amber-900 hover:bg-amber-100 hover:border-amber-500 shadow-2xs'
      };
    }
    if (tier === 'premium') {
      return {
        tier: 'premium',
        name: 'Prime / Executive Section',
        shortName: 'Prime / Exec',
        tag: '⭐ Prime / Exec',
        color: 'text-rose-800',
        borderColor: 'border-rose-400',
        bg: 'bg-rose-50',
        badgeBg: 'bg-rose-100 text-[#F84464] border-rose-300',
        seatClasses: 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100 hover:border-rose-400 shadow-2xs'
      };
    }
    return {
      tier: 'classic',
      name: 'Classic / Normal Section',
      shortName: 'Classic / Normal',
      tag: '🎟️ Classic / Normal',
      color: 'text-slate-800',
      borderColor: 'border-slate-300',
      bg: 'bg-slate-50',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
      seatClasses: 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400 shadow-2xs'
    };
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Screen Selector & Unsaved Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 text-[#F84464]">
                <Armchair className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Auditorium Seating Layout Designer</h2>
              {hasUnsavedChanges && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure custom rows, columns, and walkways for each auditorium screen. Click any seat to remove or restore it.
            </p>
          </div>

          {/* Quick Actions / Save Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveLayout}
              disabled={saving}
              className="bg-[#F84464] hover:bg-[#D63A56] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Layout...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Auditorium Layout</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Screen Selection Tabs (Multiplex vs Single Screen) */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              {theater?.theaterType === 'single_screen' ? (
                <>
                  <Tv className="w-3.5 h-3.5 text-slate-400" />
                  <span>Single Screen Cinema</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-[#F84464]" />
                  <span>Multiplex Auditorium Screens ({screens.length})</span>
                </>
              )}
            </span>

            <span className="text-[11px] text-slate-400 font-medium">
              Select a screen to design its layout
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {screens.map((sc, idx) => {
              const isSelected = sc.screenNumber === selectedScreenNumber;
              const hasCustom = Boolean(sc.layout?.rows && sc.layout?.cols);

              return (
                <button
                  key={sc.screenNumber || idx}
                  onClick={() => setSelectedScreenNumber(sc.screenNumber)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 border text-left ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center font-mono text-[11px]">
                    {sc.screenNumber}
                  </div>
                  <div>
                    <span className="block leading-tight">{sc.name}</span>
                    <span className={`text-[10px] block leading-tight mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {sc.screenType || 'Standard'} &bull; {sc.capacity || 150} seats
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ml-1 ${
                    hasCustom 
                      ? (isSelected ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                      : (isSelected ? 'bg-amber-500/20 text-amber-200' : 'bg-slate-200 text-slate-600')
                  }`}>
                    {hasCustom ? 'Customized' : 'Default'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-semibold animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{successBanner}</span>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-semibold animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{errorBanner}</span>
          <button onClick={() => setErrorBanner('')} className="text-rose-500 hover:text-rose-700 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* 3. Layout Controls Toolbar & Capacity HUD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        
        {/* Top Steppers & Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          
          {/* Dimension Inputs */}
          <div className="flex flex-wrap items-center gap-6">
            
            {/* Rows Stepper */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Rows Count (A to {rowLabels[rowLabels.length - 1] || 'H'})
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (rows > 2) {
                      setRows(rows - 1);
                      setHasUnsavedChanges(true);
                    }
                  }}
                  disabled={rows <= 2}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm disabled:opacity-40 cursor-pointer"
                  title="Remove last row"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="2"
                  max="26"
                  value={rows}
                  onChange={(e) => {
                    const val = Math.max(2, Math.min(26, parseInt(e.target.value) || 2));
                    setRows(val);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-14 h-8 text-center border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-[#F84464]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (rows < 26) {
                      setRows(rows + 1);
                      setHasUnsavedChanges(true);
                    }
                  }}
                  disabled={rows >= 26}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm disabled:opacity-40 cursor-pointer"
                  title="Add row"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Columns Stepper */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Columns Count (1 to {cols})
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (cols > 4) {
                      setCols(cols - 1);
                      setHasUnsavedChanges(true);
                    }
                  }}
                  disabled={cols <= 4}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm disabled:opacity-40 cursor-pointer"
                  title="Remove last column"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="4"
                  max="30"
                  value={cols}
                  onChange={(e) => {
                    const val = Math.max(4, Math.min(30, parseInt(e.target.value) || 4));
                    setCols(val);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-14 h-8 text-center border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-[#F84464]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (cols < 30) {
                      setCols(cols + 1);
                      setHasUnsavedChanges(true);
                    }
                  }}
                  disabled={cols >= 30}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm disabled:opacity-40 cursor-pointer"
                  title="Add column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Preset Walkways / Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Aisle Tools:
            </span>
            <button
              type="button"
              onClick={handleAddCenterAisle}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Delete the center column of seats to create a center walkway aisle"
            >
              + Center Walkway
            </button>
            <button
              type="button"
              onClick={handleAddDualAisles}
              disabled={cols < 7}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
              title="Delete left and right walkway columns"
            >
              + Dual Aisles
            </button>
            <button
              type="button"
              onClick={handleRestoreAllSeats}
              disabled={deletedCount === 0}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1"
              title="Restore all deleted seats back to active status"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Grid</span>
            </button>
          </div>

        </div>

        {/* Seat Types & Row Assignment Center */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#F84464]" />
                <span>Seat Types & Row Tier Assignment</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Assign each row to <strong>Recliner</strong>, <strong>Prime / Executive</strong>, or <strong>Classic / Normal</strong>. You can also adjust rows directly from the grid below.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPresetTiering('standard')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Front rows Recliner, Middle rows Prime, Rear rows Classic"
              >
                Balanced Mix
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetTiering('all_recliner')}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="All rows Royal Recliner Lounge"
              >
                👑 All Recliner
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetTiering('all_prime')}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-[#F84464] border border-rose-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="All rows Prime / Executive"
              >
                ⭐ All Prime
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetTiering('all_classic')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="All rows Classic / Normal"
              >
                🎟️ All Classic
              </button>
            </div>
          </div>

          {/* 3 Tier Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            
            {/* Tier 1: Recliner Card */}
            <div className="p-3.5 rounded-xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/80 to-amber-100/40 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">👑</span>
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider">Royal Recliner Lounge</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    {reclinerSeatsCount} Seats
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 mb-2">
                  Motorized leather recliners with personal armrests & footrest.
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 pt-2 border-t border-amber-200/80">
                <span>{reclinerRows.length} Rows: <strong>{reclinerRows.join(', ') || 'None'}</strong></span>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTiering('all_recliner')}
                  className="text-[10px] text-amber-800 hover:text-amber-950 underline font-semibold cursor-pointer"
                >
                  Make All
                </button>
              </div>
            </div>

            {/* Tier 2: Prime / Executive Card */}
            <div className="p-3.5 rounded-xl border-2 border-rose-300/80 bg-gradient-to-br from-rose-50/80 to-pink-50/40 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">⭐</span>
                    <span className="text-xs font-black text-rose-950 uppercase tracking-wider">Prime / Executive</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                    {primeSeatsCount} Seats
                  </span>
                </div>
                <p className="text-[11px] text-rose-900/80 mb-2">
                  Premium middle rows with optimal screen viewing sweet-spot.
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-950 pt-2 border-t border-rose-200/80">
                <span>{primeRows.length} Rows: <strong>{primeRows.join(', ') || 'None'}</strong></span>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTiering('all_prime')}
                  className="text-[10px] text-rose-800 hover:text-rose-950 underline font-semibold cursor-pointer"
                >
                  Make All
                </button>
              </div>
            </div>

            {/* Tier 3: Classic / Normal Card */}
            <div className="p-3.5 rounded-xl border-2 border-slate-300/80 bg-gradient-to-br from-slate-50 to-slate-100/40 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🎟️</span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Classic / Normal</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                    {classicSeatsCount} Seats
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-2">
                  Standard comfortable auditorium cinema seating.
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 pt-2 border-t border-slate-200">
                <span>{classicRows.length} Rows: <strong>{classicRows.join(', ') || 'None'}</strong></span>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTiering('all_classic')}
                  className="text-[10px] text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
                >
                  Make All
                </button>
              </div>
            </div>

          </div>

          {/* Interactive Row Chip Selector Strip */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
              Select or cycle seat type for each row (Click pill to cycle: 👑 Recliner ➔ ⭐ Prime / Exec ➔ 🎟️ Classic / Normal):
            </span>
            <div className="flex flex-wrap gap-2">
              {rowLabels.map(row => {
                const tier = getRowTier(row);
                const info = getRowTierInfo(row);

                return (
                  <div
                    key={`chip-${row}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
                      tier === 'recliner'
                        ? 'bg-amber-100/90 border-amber-400 text-amber-950'
                        : tier === 'premium'
                        ? 'bg-rose-100/90 border-rose-300 text-rose-950'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <span className="w-5 h-5 rounded bg-black/10 flex items-center justify-center font-mono text-[11px]">
                      {row}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCycleRowTier(row)}
                      className="hover:underline flex items-center gap-1 cursor-pointer"
                      title={`Row ${row}: Click to cycle seat type`}
                    >
                      <span>{info.icon}</span>
                      <span>{info.shortName}</span>
                    </button>
                    <select
                      value={tier}
                      onChange={(e) => handleSetRowTier(row, e.target.value)}
                      className="text-[10px] bg-transparent font-bold outline-none cursor-pointer border-l border-black/15 pl-1"
                      title={`Change seat type for Row ${row}`}
                    >
                      <option value="recliner">Recliner</option>
                      <option value="premium">Prime/Exec</option>
                      <option value="classic">Classic/Normal</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Capacity HUD Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Capacity
            </span>
            <p className="text-xl font-black text-slate-900 flex items-baseline gap-1">
              <span>{activeCapacity}</span>
              <span className="text-[11px] font-normal text-slate-500">seats</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
              👑 Recliners
            </span>
            <p className="text-xl font-black text-amber-900 flex items-baseline gap-1">
              <span>{reclinerSeatsCount}</span>
              <span className="text-[10px] font-bold text-amber-700">({reclinerRows.length}r)</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-0.5">
              ⭐ Prime / Exec
            </span>
            <p className="text-xl font-black text-rose-750 flex items-baseline gap-1">
              <span>{primeSeatsCount}</span>
              <span className="text-[10px] font-bold text-rose-600">({primeRows.length}r)</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
              🎟️ Classic / Normal
            </span>
            <p className="text-xl font-black text-slate-800 flex items-baseline gap-1">
              <span>{classicSeatsCount}</span>
              <span className="text-[10px] font-bold text-slate-500">({classicRows.length}r)</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              🚷 Aisle Spaces
            </span>
            <p className="text-xl font-black text-slate-500 flex items-baseline gap-1">
              <span>{deletedCount}</span>
              <span className="text-[11px] font-normal text-slate-400">aisles</span>
            </p>
          </div>
        </div>

      </div>

      {/* 4. Interactive Visual Auditorium Seating Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6 overflow-hidden">
        
        {/* Instruction Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#F84464] shrink-0" />
            <p className="text-slate-700 font-medium">
              <strong>Interactive Seating Grid:</strong> Click on any seat to <strong>Delete</strong> it (creates an aisle / empty space). Click on a deleted spot to <strong>Restore</strong> it.
            </p>
          </div>

          {/* Visual Legend with Live Counts */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-amber-50 border border-amber-400 text-amber-900 flex items-center justify-center font-bold text-[9px] shadow-2xs">
                👑
              </span>
              <span className="font-semibold text-amber-950">Royal Recliner ({reclinerSeatsCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-rose-50 border border-rose-400 text-[#F84464] flex items-center justify-center font-bold text-[9px] shadow-2xs">
                ⭐
              </span>
              <span className="font-semibold text-rose-950">Prime / Executive ({primeSeatsCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-[9px] shadow-2xs">
                🎟️
              </span>
              <span className="font-semibold text-slate-800">Classic / Normal ({classicSeatsCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-white border-2 border-dashed border-slate-300"></span>
              <span className="text-slate-400 font-semibold">Deleted / Aisle ({deletedCount})</span>
            </div>
          </div>
        </div>

        {/* Cinema Projection Screen Arc */}
        <div className="w-full flex flex-col items-center pt-2">
          <div className="relative w-full max-w-2xl flex justify-center">
            <svg className="w-full h-10" viewBox="0 0 500 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="designerScreenGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
                  <stop offset="25%" stopColor="#818cf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
                  <stop offset="75%" stopColor="#818cf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M 20 42 Q 250 8 480 42"
                fill="transparent"
                stroke="url(#designerScreenGlow)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-0.5">
            <span>Auditorium Screen ({selectedScreen.name})</span>
          </div>
        </div>

        {/* Scrollable Seating Matrix Container */}
        <div className="overflow-x-auto py-6 flex flex-col items-center bg-slate-50/70 rounded-xl border border-slate-200">
          
          {/* Top Column Number Headers (with Toggle Column action) */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="w-36 flex items-center justify-end pr-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Row & Type
            </div>
            <div className="flex gap-1.5">
              {colNumbers.map((col) => (
                <button
                  key={`col-hdr-${col}`}
                  type="button"
                  onClick={() => handleToggleColumn(col)}
                  className="w-7 h-6 md:w-8 md:h-6 text-[11px] font-bold text-slate-500 hover:text-[#F84464] hover:bg-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                  title={`Toggle Column ${col} (Click to delete/restore entire column)`}
                >
                  {col}
                </button>
              ))}
            </div>
            <div className="w-20 pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Row
            </div>
          </div>

          {/* Row By Row Matrix with Section Divider Banners */}
          <div className="space-y-2">
            {rowLabels.map((row, index) => {
              const tierInfo = getRowTierInfo(row);
              const isFirstOfTier = index === 0 || getRowTier(row) !== getRowTier(rowLabels[index - 1]);
              const activeInThisRow = colNumbers.filter(c => !deletedSeats.has(`${row}${c}`)).length;

              return (
                <div key={row} className="flex flex-col items-center">
                  
                  {/* Section Divider Banner (Rendered when seat type changes) */}
                  {isFirstOfTier && (
                    <div className={`w-full flex items-center justify-between px-4 py-1.5 rounded-lg my-2 border shadow-2xs ${
                      tierInfo.tier === 'recliner'
                        ? 'bg-amber-100/70 border-amber-300 text-amber-950'
                        : tierInfo.tier === 'premium'
                        ? 'bg-rose-100/70 border-rose-300 text-rose-950'
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{tierInfo.icon}</span>
                        <span className="text-xs font-black uppercase tracking-wider">
                          {tierInfo.name}
                        </span>
                        <span className="text-[10px] font-medium opacity-80 hidden sm:inline">
                          ({tierInfo.tier === 'recliner' ? 'Luxury wide motorized recliners' : tierInfo.tier === 'premium' ? 'Premium center sightline' : 'Standard auditorium seating'})
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/90 border border-black/10">
                        {tierInfo.tier === 'recliner' ? reclinerSeatsCount : tierInfo.tier === 'premium' ? primeSeatsCount : classicSeatsCount} Active Seats
                      </span>
                    </div>
                  )}

                  {/* The Row Itself */}
                  <div className="flex items-center justify-center gap-1.5">
                    
                    {/* Left: Row letter & Interactive Seat Type Selector */}
                    <div className="w-36 flex items-center justify-end gap-1.5 pr-1">
                      <button
                        type="button"
                        onClick={() => handleToggleRow(row)}
                        className="w-6 h-7 md:h-8 text-xs font-black text-slate-700 hover:text-[#F84464] hover:bg-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                        title={`Toggle Row ${row} (Click to delete/restore entire row)`}
                      >
                        {row}
                      </button>

                      {/* Dropdown to change seat type for this row */}
                      <select
                        value={getRowTier(row)}
                        onChange={(e) => handleSetRowTier(row, e.target.value)}
                        className={`text-[10px] font-extrabold rounded-lg px-2 py-1 border transition-all cursor-pointer outline-none shadow-2xs ${
                          tierInfo.tier === 'recliner'
                            ? 'bg-amber-100 text-amber-950 border-amber-400 hover:bg-amber-200'
                            : tierInfo.tier === 'premium'
                            ? 'bg-rose-100 text-[#F84464] border-rose-300 hover:bg-rose-200'
                            : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                        }`}
                        title={`Select seat type for Row ${row}`}
                      >
                        <option value="recliner">👑 Recliner</option>
                        <option value="premium">⭐ Prime/Exec</option>
                        <option value="classic">🎟️ Classic/Normal</option>
                      </select>
                    </div>

                    {/* Seat Cells in this Row */}
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
                              className={`border-2 border-dashed border-slate-300 bg-white hover:bg-emerald-50 hover:border-emerald-400 rounded text-[10px] text-slate-300 hover:text-emerald-600 transition-all flex items-center justify-center cursor-pointer group shadow-2xs ${
                                tierInfo.tier === 'recliner' ? 'w-9 h-8 md:w-10 md:h-8' : 'w-7 h-7 md:w-8 md:h-8'
                              }`}
                              title={`Aisle Space (${seatId}) - Click to Restore Seat`}
                            >
                              <span className="opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                                +
                              </span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={seatId}
                            type="button"
                            onClick={() => handleToggleSeat(seatId)}
                            className={`border rounded text-xs font-semibold transition-all relative flex items-center justify-center cursor-pointer group active:scale-95 shadow-2xs ${
                              tierInfo.tier === 'recliner'
                                ? 'w-9 h-8 md:w-10 md:h-8 bg-amber-50 border-amber-400 text-amber-950 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-700'
                                : tierInfo.tier === 'premium'
                                ? 'w-7 h-7 md:w-8 md:h-8 bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100 hover:border-rose-400 hover:text-rose-700'
                                : 'w-7 h-7 md:w-8 md:h-8 bg-white border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400'
                            }`}
                            title={`Active Seat: ${seatId} (${tierInfo.name}) - Click to Delete (Make Aisle)`}
                          >
                            {/* Seat Number */}
                            <span className="group-hover:hidden text-[11px] font-bold">
                              {col}
                            </span>

                            {/* Hover Delete Action Icon */}
                            <span className="hidden group-hover:flex items-center justify-center text-rose-600 font-extrabold text-xs">
                              &times;
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right: Row Label & Seat Count */}
                    <div className="w-20 flex items-center gap-1.5 pl-1">
                      <button
                        type="button"
                        onClick={() => handleToggleRow(row)}
                        className="w-6 h-7 md:h-8 text-xs font-black text-slate-700 hover:text-[#F84464] hover:bg-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                        title={`Toggle Row ${row}`}
                      >
                        {row}
                      </button>
                      <span className="text-[10px] font-bold text-slate-400">
                        {activeInThisRow}s
                      </span>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

          {/* Bottom Column Number Headers */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <div className="w-36 text-right pr-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Row & Type
            </div>
            <div className="flex gap-1.5">
              {colNumbers.map((col) => (
                <span
                  key={`col-ftr-${col}`}
                  className="w-7 h-5 md:w-8 md:h-5 text-[10px] font-bold text-slate-400 flex items-center justify-center"
                >
                  {col}
                </span>
              ))}
            </div>
            <div className="w-20 pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Row
            </div>
          </div>

        </div>

        {/* Bottom Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              Configured for <strong>{selectedScreen.name}</strong>: <strong>{activeCapacity} seats</strong> ({deletedCount} aisles)
            </span>
          </div>

          <button
            onClick={handleSaveLayout}
            disabled={saving}
            className="w-full sm:w-auto bg-[#F84464] hover:bg-[#D63A56] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Layout...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Auditorium Layout</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};

export default ScreenLayoutDesigner;

