import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Ticket, 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Upload, 
  Search, 
  AlertTriangle, 
  Building2, 
  Clock, 
  Calendar, 
  User, 
  Film,
  Sparkles,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';
import { playScanSuccessChime, playScanErrorChime } from '../utils/audio';

const TicketGateScanner = ({ userRole = 'partner', currentTheater = null }) => {
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'

  // Session stats & log
  const [sessionLogs, setSessionLogs] = useState([]);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const isScanningRef = useRef(false);

  // Enumerate cameras on mount
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera if identified
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.debug('No camera devices enumerated or permission pending:', err);
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  // Stop camera helper
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
      } catch (err) {
        console.debug('Error stopping camera:', err);
      }
    }
    setCameraActive(false);
  };

  // Start camera helper
  const startCamera = async (camIdOrFacing = null) => {
    try {
      setCameraLoading(true);
      setCameraError(null);

      // Stop existing if any
      await stopCamera();

      // Ensure element exists
      const readerElem = document.getElementById('gate-qr-reader');
      if (!readerElem) {
        throw new Error('Scanner container element not found.');
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('gate-qr-reader');
      }

      // Sanitize input in case a React SyntheticEvent was passed via onClick={startCamera}
      const isStringArg = typeof camIdOrFacing === 'string' && camIdOrFacing.trim().length > 0;
      let cameraParam = { facingMode: facingMode || 'environment' };

      if (isStringArg) {
        if (camIdOrFacing === 'environment' || camIdOrFacing === 'user') {
          cameraParam = { facingMode: camIdOrFacing };
        } else {
          cameraParam = camIdOrFacing; // camera deviceId string
        }
      } else if (selectedCameraId && typeof selectedCameraId === 'string' && selectedCameraId.length > 5) {
        cameraParam = selectedCameraId;
      }

      await html5QrCodeRef.current.start(
        cameraParam,
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Detected QR code!
          handleScannedCode(decodedText);
        },
        (error) => {
          // Silent scan frame parse errors
        }
      );

      isScanningRef.current = true;
      setCameraActive(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError(err.message || 'Could not access camera feed. Ensure camera permissions are granted.');
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Flip Camera between front & back
  const handleFlipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  // Process Scanned or Manual Ticket Code
  const handleScannedCode = async (rawCode) => {
    if (!rawCode || loading) return;

    // Temporarily pause camera stream while processing
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.pause();
      } catch (e) {
        // Ignore if pausing not supported
      }
    }

    const cleanCode = String(rawCode).replace(/^TICKET:/i, '').trim();
    await verifyTicket(cleanCode);
  };

  // Server Ticket Verification Request
  const verifyTicket = async (ticketIdentifier) => {
    setLoading(true);
    setScanStatus(null);
    setMessage('');
    setScanResult(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/validate-ticket`, { 
        paymentId: ticketIdentifier 
      });

      const booking = res.data;
      setScanResult(booking);
      setScanStatus('success');
      setMessage(`Ticket Validated! Reserved Seats: ${booking.seats?.join(', ')}`);
      playScanSuccessChime();

      // Check theater mismatch for theater partner
      const bookedTheaterId = booking.showtime?.theaterId?._id || booking.showtime?.theaterId;
      const isCurrentTheater = currentTheater?._id ? String(bookedTheaterId) === String(currentTheater._id) : true;

      // Add to session audit log
      setSessionLogs((prev) => [
        {
          id: booking._id,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          movieTitle: booking.movie?.title || 'Movie',
          seats: booking.seats?.join(', ') || 'N/A',
          customer: booking.user?.email || booking.user?.name || 'Customer',
          status: 'VALID',
          isMismatch: !isCurrentTheater,
          theaterName: booking.showtime?.theaterId?.name || 'Cinema Hall'
        },
        ...prev.slice(0, 19)
      ]);

    } catch (err) {
      setScanStatus('error');
      const errorMsg = err.response?.data?.msg || 'Invalid Ticket QR code or booking reference.';
      setMessage(errorMsg);
      playScanErrorChime();

      setSessionLogs((prev) => [
        {
          id: ticketIdentifier.substring(0, 16),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          movieTitle: 'Unknown / Invalid',
          seats: '—',
          customer: 'Unknown',
          status: 'DENIED',
          isMismatch: false,
          theaterName: '—'
        },
        ...prev.slice(0, 19)
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Manual Input Submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    verifyTicket(manualInput.trim());
  };

  // File Upload QR Scan Fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setCameraError(null);

      // Stop camera if currently running
      await stopCamera();

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('gate-qr-reader');
      }

      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      await verifyTicket(decodedText);
    } catch (err) {
      setScanStatus('error');
      setMessage('No valid ticket QR code detected in the uploaded image.');
      playScanErrorChime();
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reset to Scan Next
  const handleResetForNext = () => {
    setScanStatus(null);
    setScanResult(null);
    setManualInput('');
    setMessage('');

    // Resume or restart camera
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.resume();
      } catch (e) {
        startCamera();
      }
    } else {
      startCamera();
    }
  };

  // Theater match evaluation
  const bookedTheater = scanResult?.showtime?.theaterId;
  const isTheaterMismatch = currentTheater && bookedTheater && (
    (currentTheater._id && bookedTheater._id && String(currentTheater._id) !== String(bookedTheater._id)) ||
    (currentTheater.name && bookedTheater.name && currentTheater.name.toLowerCase() !== bookedTheater.name.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Badge & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-50 text-[#F84464]">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {userRole === 'partner' ? 'Auditorium Gate Security & QR Scanner' : 'Central Box Office & Gate Scanner'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {userRole === 'partner' && currentTheater 
                  ? `Active Gate Validation Desk for: ${currentTheater.name} (${currentTheater.city})`
                  : 'Verify customer mobile m-tickets and validate rapid admission at venue entrance.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right status badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            cameraActive 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
            <span>{cameraActive ? 'Live Camera Scanning' : 'Camera Standby'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            {sessionLogs.filter(l => l.status === 'VALID').length} Scanned
          </div>
        </div>
      </div>

      {/* 2. Main Dual Column Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Camera Feed & Manual Input (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Camera Viewfinder Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Optical QR Scanner Feed
                </h3>
              </div>

              {/* Camera Actions Toolbar */}
              <div className="flex items-center gap-2">
                {cameras.length > 1 && (
                  <button
                    onClick={handleFlipCamera}
                    disabled={!cameraActive}
                    className="p-1.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    title="Switch camera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Flip</span>
                  </button>
                )}

                <button
                  onClick={toggleCamera}
                  disabled={cameraLoading}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    cameraActive 
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200' 
                      : 'bg-[#F84464] hover:bg-[#d63a56] text-white shadow-pink-500/20'
                  }`}
                >
                  {cameraLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Starting...</span>
                    </>
                  ) : cameraActive ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Start Camera</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Banner if camera failed */}
            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Camera Access Notice</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">{cameraError}</p>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Tip: You can use the <strong>Upload Photo / Snap</strong> button below or enter the Booking ID manually.
                  </p>
                </div>
              </div>
            )}

            {/* Scanner Container Box */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 aspect-square sm:aspect-video flex items-center justify-center border-2 border-dashed border-gray-300">
              
              {/* Target div for Html5Qrcode */}
              <div id="gate-qr-reader" className="w-full h-full"></div>

              {/* Overlay graphics when camera is active */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Viewfinder Target Reticle */}
                  <div className="w-60 h-60 border-2 border-emerald-400/70 rounded-2xl relative shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                    
                    {/* Scanning Laser Beam Animation */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2"></div>
                  </div>

                  <span className="absolute bottom-4 bg-black/60 backdrop-blur-md text-emerald-300 text-[11px] font-mono px-3 py-1 rounded-full border border-emerald-500/30">
                    ALIGN TICKET QR INSIDE FRAME
                  </span>
                </div>
              )}

              {/* Fallback Graphic when camera is off */}
              {!cameraActive && (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 text-white/70 flex items-center justify-center mx-auto backdrop-blur-xs">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Camera Feed Paused</p>
                    <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto">
                      Click "Start Camera" to enable optical scanning through your device webcam or phone camera.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    disabled={cameraLoading}
                    className="inline-flex items-center gap-1.5 bg-[#F84464] hover:bg-[#d63a56] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/20 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Launch Camera Scanner</span>
                  </button>
                </div>
              )}
            </div>

            {/* Alternative: Snap / Upload image */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <span className="text-[11px]">Can't use live camera feed?</span>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors">
                <Upload className="w-3.5 h-3.5 text-gray-500" />
                <span>Upload QR Image / Photo</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Manual Reference Lookup Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                Manual Reference ID Lookup
              </h3>
            </div>
            <p className="text-[11px] text-gray-500">
              If customer screen is dim or QR code cannot be read, enter the 24-character Booking ID or payment ID (pay_xxx / WALLET_xxx).
            </p>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input 
                type="text" 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. 67b..., pay_P123..., or WALLET_998..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-[#F84464] focus:bg-white transition-colors"
              />
              <button 
                type="submit"
                disabled={loading || !manualInput.trim()}
                className="bg-[#1A1C24] hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Validate</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: Admission Result Display (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Result Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs min-h-[460px] flex flex-col justify-between">
            
            {scanStatus === null ? (
              // Awaiting Scan State
              <div className="my-auto text-center space-y-3 p-6">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-300 shadow-inner">
                  <QrCode className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Awaiting Admission Scan</h4>
                  <p className="text-xs text-gray-400 max-w-[240px] mx-auto mt-1">
                    Point attendee mobile ticket QR code at the camera frame or enter reference ID to verify admission.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-gray-400 font-mono">
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md">M-Ticket QR</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md">Instant Validation</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md">Anti-Fraud</span>
                </div>
              </div>
            ) : scanStatus === 'success' ? (
              // SUCCESS: Valid Ticket State
              <div className="space-y-4 animate-fade-in">
                
                {/* Header status badge */}
                <div className="text-center pt-2">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50/50">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                      Admission Authorized
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-2">Ticket Verified & Clear</h3>
                  </div>
                </div>

                {/* Cross-Theater Mismatch Alert */}
                {isTheaterMismatch && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Cinema Venue Mismatch Warning!</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-tight">
                      This ticket was booked for <strong>{bookedTheater?.name || 'Another Cinema'}</strong> ({bookedTheater?.city || 'Other City'}).
                      Your current venue is <strong>{currentTheater?.name}</strong>.
                    </p>
                  </div>
                )}

                {/* Scanned Ticket Metadata Box */}
                {scanResult && (
                  <div className="bg-gray-50/90 rounded-2xl p-4.5 border border-gray-200/80 text-xs space-y-3">
                    
                    {/* Movie Info */}
                    <div className="flex items-start gap-3 pb-3 border-b border-gray-200/60">
                      {scanResult.movie?.image && (
                        <img 
                          src={scanResult.movie.image} 
                          alt={scanResult.movie?.title} 
                          className="w-12 h-16 object-cover rounded-lg shadow-xs shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#F84464] bg-rose-50 px-2 py-0.5 rounded-md">
                          {scanResult.showtime?.format || 'Standard'}
                        </span>
                        <h4 className="font-extrabold text-sm text-gray-900 truncate mt-1">
                          {scanResult.movie?.title}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          {scanResult.movie?.language || 'Telugu'} • {scanResult.movie?.genre || 'Cinema'}
                        </p>
                      </div>
                    </div>

                    {/* Venue & Hall */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Theater:</span>
                        <span className="font-bold text-gray-900 text-right truncate max-w-[180px]">
                          {bookedTheater?.name || 'Partner Cinema'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Auditorium / Screen:</span>
                        <span className="font-bold text-gray-900">
                          {scanResult.showtime?.screen || 'Audi 1'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Show Schedule:</span>
                        <span className="font-semibold text-gray-800">
                          {scanResult.showtime?.date || 'Today'} @ {scanResult.showtime?.time || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Seats Highlight */}
                    <div className="pt-2 border-t border-gray-200/60">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Reserved Seats ({scanResult.seats?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {scanResult.seats?.map((seat) => (
                          <span 
                            key={seat}
                            className="px-2.5 py-1 bg-gray-900 text-white rounded-lg font-mono font-bold text-xs shadow-xs"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Customer & Payment */}
                    <div className="pt-2 border-t border-gray-200/60 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Customer:</span>
                        <span className="font-medium text-gray-700 truncate max-w-[160px]">
                          {scanResult.user?.name || scanResult.user?.email || 'Registered User'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Paid:</span>
                        <span className="font-bold text-emerald-700">₹{scanResult.totalAmount}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[10px] text-gray-400 pt-1">
                        <span>Ref ID:</span>
                        <span className="truncate max-w-[140px]">{scanResult._id}</span>
                      </div>
                    </div>

                  </div>
                )}

                {/* Scan Next Button */}
                <button 
                  onClick={handleResetForNext}
                  className="w-full py-3 bg-[#F84464] hover:bg-[#d63a56] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Next Customer Ticket</span>
                </button>

              </div>
            ) : (
              // ERROR / DENIED: Invalid Ticket State
              <div className="space-y-4 animate-fade-in text-center my-auto">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-rose-50/50">
                  <XCircle className="w-9 h-9" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700 bg-rose-100/70 px-3 py-1 rounded-full border border-rose-200">
                    Admission Denied
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-2">Invalid or Unrecognized Ticket</h3>
                  <p className="text-xs text-rose-600 font-medium mt-1 max-w-xs mx-auto">{message}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl text-[11px] text-gray-500 text-left space-y-1">
                  <p className="font-semibold text-gray-700">Potential Reasons:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                    <li>QR code was not issued by BookMyShow platform.</li>
                    <li>Payment was not finalized or was refunded.</li>
                    <li>Screen brightness is low; try entering Booking ID manually.</li>
                  </ul>
                </div>

                <button 
                  onClick={handleResetForNext}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again / Next Ticket</span>
                </button>
              </div>
            )}

            {/* Shift Summary Footnote */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Shift Security Desk</span>
              <span className="font-mono">Gate Status: Online</span>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Session Admission Audit Trail (Recent Scans) */}
      {sessionLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Session Admission Audit Log ({sessionLogs.length})
              </h3>
            </div>
            <button
              onClick={() => setSessionLogs([])}
              className="text-[11px] text-gray-400 hover:text-gray-700 font-medium cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Ticket / Booking ID</th>
                  <th className="py-2.5 px-4">Movie</th>
                  <th className="py-2.5 px-4">Seats</th>
                  <th className="py-2.5 px-4">Attendee</th>
                  <th className="py-2.5 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-sans">
                {sessionLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-400">{log.time}</td>
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">{log.id}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{log.movieTitle}</td>
                    <td className="py-3 px-4 font-mono font-bold text-gray-800">{log.seats}</td>
                    <td className="py-3 px-4 text-gray-500 truncate max-w-[150px]">{log.customer}</td>
                    <td className="py-3 px-4 text-right">
                      {log.status === 'VALID' ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.isMismatch 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{log.isMismatch ? 'Cross-Theater' : 'Admitted'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Denied</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default TicketGateScanner;
