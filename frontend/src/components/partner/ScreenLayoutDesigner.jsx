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
  Maximize2
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

  // Tier configuration for row groups
  const [reclinerRowCount, setReclinerRowCount] = useState(2);
  const [primeRowCount, setPrimeRowCount] = useState(3);

  // Status banners & loading
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load layout from selected screen whenever selectedScreenNumber changes
  useEffect(() => {
    if (!selectedScreen) return;

    if (selectedScreen.layout && selectedScreen.layout.rows && selectedScreen.layout.cols) {
      const l = selectedScreen.layout;
      setRows(l.rows);
      setCols(l.cols);
      setDeletedSeats(new Set(l.deletedSeats || []));

      // Calculate tier counts from tierConfig
      if (l.tierConfig) {
        const reclinerCount = l.tierConfig.reclinerRows?.length ?? 2;
        const primeCount = l.tierConfig.premiumRows?.length ?? 3;
        setReclinerRowCount(reclinerCount);
        setPrimeRowCount(primeCount);
      }
    } else {
      // Sensible default layout: 8 rows x 12 cols
      setRows(8);
      setCols(12);
      setDeletedSeats(new Set());
      setReclinerRowCount(2);
      setPrimeRowCount(3);
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

  // Computed tier rows
  const reclinerRows = useMemo(() => {
    return rowLabels.slice(0, Math.min(reclinerRowCount, rows));
  }, [rowLabels, reclinerRowCount, rows]);

  const primeRows = useMemo(() => {
    const start = Math.min(reclinerRowCount, rows);
    const end = Math.min(start + primeRowCount, rows);
    return rowLabels.slice(start, end);
  }, [rowLabels, reclinerRowCount, primeRowCount, rows]);

  const classicRows = useMemo(() => {
    const start = Math.min(reclinerRowCount + primeRowCount, rows);
    return rowLabels.slice(start);
  }, [rowLabels, reclinerRowCount, primeRowCount, rows]);

  // Calculate live capacity & stats
  const totalSlots = rows * cols;
  const deletedCount = deletedSeats.size;
  const activeCapacity = Math.max(0, totalSlots - deletedCount);

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
        // Restore all seats in row
        rowSeats.forEach(s => next.delete(s));
      } else {
        // Delete all seats in row
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
        // Restore all seats in column
        colSeats.forEach(s => next.delete(s));
      } else {
        // Delete all seats in column
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
        `Layout for "${selectedScreen.name}" saved successfully with ${activeCapacity} seats! Booking pages will now display this customized layout.`
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

  // Helper to determine tier of a row
  const getRowTierInfo = (row) => {
    if (reclinerRows.includes(row)) {
      return { name: 'Royal Recliner', color: 'text-amber-600', border: 'border-amber-300', bg: 'bg-amber-50/70', badge: 'bg-amber-100 text-amber-800' };
    }
    if (primeRows.includes(row)) {
      return { name: 'Prime Circle', color: 'text-[#F84464]', border: 'border-rose-300', bg: 'bg-rose-50/70', badge: 'bg-rose-100 text-[#F84464]' };
    }
    return { name: 'Classic / Executive', color: 'text-slate-700', border: 'border-slate-300', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-700' };
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

            {/* Tier Division Control */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Seating Tiers Division
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-amber-600 font-semibold text-[11px]">
                  Recliner: {reclinerRows.length} rows ({reclinerRows.join(', ') || 'None'})
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-[#F84464] font-semibold text-[11px]">
                  Prime: {primeRows.length} rows ({primeRows[0] || '-'}{primeRows.length > 1 ? `-${primeRows[primeRows.length - 1]}` : ''})
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-600 font-semibold text-[11px]">
                  Classic: {classicRows.length} rows ({classicRows[0] || '-'}{classicRows.length > 1 ? `-${classicRows[classicRows.length - 1]}` : ''})
                </span>
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

        {/* Live Capacity HUD Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Active Seating Capacity
            </span>
            <p className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
              <span>{activeCapacity}</span>
              <span className="text-xs font-normal text-slate-500">seats</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Deleted / Walkway Aisles
            </span>
            <p className="text-2xl font-black text-rose-600 flex items-baseline gap-1">
              <span>{deletedCount}</span>
              <span className="text-xs font-normal text-slate-500">spaces</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Auditorium Grid Dimensions
            </span>
            <p className="text-2xl font-black text-slate-700">
              {rows} &times; {cols}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Auditorium Screen
            </span>
            <p className="text-sm font-black text-slate-900 truncate mt-1">
              {selectedScreen.name} ({selectedScreen.screenType})
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

          {/* Visual Legend */}
          <div className="flex items-center gap-4 text-[11px] shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-400 text-amber-700 flex items-center justify-center font-bold text-[8px]">R</span>
              <span>Recliner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-400 text-[#F84464] flex items-center justify-center font-bold text-[8px]">P</span>
              <span>Prime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-[8px]">C</span>
              <span>Classic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white border border-dashed border-slate-300"></span>
              <span className="text-slate-400 font-semibold">Deleted / Aisle</span>
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
            <span className="w-6 text-[10px] font-bold text-slate-400 text-center">Row</span>
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
            <span className="w-6 text-[10px] font-bold text-slate-400 text-center">Row</span>
          </div>

          {/* Row By Row Matrix */}
          <div className="space-y-2">
            {rowLabels.map((row) => {
              const tierInfo = getRowTierInfo(row);

              return (
                <div key={row} className="flex items-center justify-center gap-1.5">
                  
                  {/* Left Row Label (Click to toggle entire row) */}
                  <button
                    type="button"
                    onClick={() => handleToggleRow(row)}
                    className="w-6 h-7 md:h-8 text-xs font-bold text-slate-500 hover:text-[#F84464] hover:bg-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                    title={`Toggle Row ${row} (Click to delete/restore entire row)`}
                  >
                    {row}
                  </button>

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
                            className="w-7 h-7 md:w-8 md:h-8 border-2 border-dashed border-slate-300/80 bg-white hover:bg-emerald-50 hover:border-emerald-400 rounded text-[10px] text-slate-300 hover:text-emerald-600 transition-all flex items-center justify-center cursor-pointer group shadow-2xs"
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
                          className={`w-7 h-7 md:w-8 md:h-8 border rounded text-xs font-semibold transition-all relative flex items-center justify-center cursor-pointer group active:scale-95 shadow-2xs ${tierInfo.bg} ${tierInfo.border} ${tierInfo.color} hover:bg-rose-50 hover:border-rose-400 hover:text-rose-700`}
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

                  {/* Right Row Label */}
                  <button
                    type="button"
                    onClick={() => handleToggleRow(row)}
                    className="w-6 h-7 md:h-8 text-xs font-bold text-slate-500 hover:text-[#F84464] hover:bg-slate-200 rounded flex items-center justify-center transition-colors cursor-pointer"
                    title={`Toggle Row ${row}`}
                  >
                    {row}
                  </button>

                </div>
              );
            })}
          </div>

          {/* Bottom Column Number Headers */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="w-6 text-[10px] font-bold text-slate-400 text-center">Row</span>
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
            <span className="w-6 text-[10px] font-bold text-slate-400 text-center">Row</span>
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
