import { useState, useEffect } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';

const AdminScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Initialize Scanner on mount
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    scanner.render(
      (result) => {
        scanner.clear();
        handleTicketVerification(result);
      },
      (error) => {
        // Handle scan failure silently to keep scanning
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleTicketVerification = async (ticketData) => {
    setLoading(true);
    setScanStatus(null);
    setMessage('');
    
    try {
      // ticketData from QR is "TICKET:razorpay_payment_id"
      const paymentId = ticketData.replace('TICKET:', '');
      
      // We will create a new endpoint /api/admin/validate-ticket
      const res = await axios.post('http://localhost:5000/api/admin/validate-ticket', { paymentId });
      
      setScanStatus('success');
      setMessage(`Ticket Validated! Seats: ${res.data.seats.join(', ')}`);
      setScanResult(res.data);
    } catch (err) {
      setScanStatus('error');
      setMessage(err.response?.data?.msg || 'Invalid Ticket or Already Used');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput) return;
    handleTicketVerification(manualInput);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <QrCode className="w-6 h-6 text-[#F84464]" />
        Ticket Scanner
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Col: Camera */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Scan QR Code</h3>
          <div id="reader" className="w-full bg-gray-50 overflow-hidden rounded-lg border-2 border-dashed border-gray-300"></div>
          
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700 mb-4">Or Enter Payment ID</h3>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input 
                type="text" 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="pay_P1xyz..."
                className="flex-1 border rounded-lg px-4 py-2 outline-none focus:border-[#F84464]"
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#333333] hover:bg-black text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? '...' : 'Verify'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Result */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
          {scanStatus === null ? (
            <div className="text-center text-gray-400">
              <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Waiting for scan...</p>
            </div>
          ) : scanStatus === 'success' ? (
            <div className="text-center animate-fade-in-up">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Valid Ticket</h3>
              <p className="text-green-600 font-medium mb-4">{message}</p>
              {scanResult && (
                <div className="bg-gray-50 rounded-lg p-4 text-left border">
                  <p className="text-sm text-gray-500 mb-1">Movie: <span className="font-semibold text-gray-800">{scanResult.movie.title}</span></p>
                  <p className="text-sm text-gray-500 mb-1">User: <span className="font-semibold text-gray-800">{scanResult.user.email}</span></p>
                  <p className="text-sm text-gray-500">Seats: <span className="font-semibold text-gray-800">{scanResult.seats.join(', ')}</span></p>
                </div>
              )}
              <button 
                onClick={() => { setScanStatus(null); setScanResult(null); }}
                className="mt-6 text-[#F84464] font-medium hover:underline"
              >
                Scan Another
              </button>
            </div>
          ) : (
            <div className="text-center animate-fade-in-up">
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Invalid Ticket</h3>
              <p className="text-red-500 font-medium">{message}</p>
              <button 
                onClick={() => { setScanStatus(null); setScanResult(null); }}
                className="mt-6 text-gray-500 font-medium hover:underline"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default AdminScanner;
