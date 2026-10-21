import { X } from 'lucide-react';
import { useState } from 'react';

const vehicleIcons = {
  1: 'https://in.bmscdn.com/webin/common/icons/bicycle.png',
  2: 'https://in.bmscdn.com/webin/common/icons/scooter.png',
  3: 'https://in.bmscdn.com/webin/common/icons/auto.png',
  4: 'https://in.bmscdn.com/webin/common/icons/car.png',
  5: 'https://in.bmscdn.com/webin/common/icons/car.png',
  6: 'https://in.bmscdn.com/webin/common/icons/van.png',
  7: 'https://in.bmscdn.com/webin/common/icons/van.png',
  8: 'https://in.bmscdn.com/webin/common/icons/van.png',
  9: 'https://in.bmscdn.com/webin/common/icons/bus.png',
  10: 'https://in.bmscdn.com/webin/common/icons/bus.png'
};

const SeatQuantityModal = ({ isOpen, onClose, onConfirm, showtimeInfo }) => {
  const [quantity, setQuantity] = useState(2);

  if (!isOpen) return null;

  const currentVehicle = vehicleIcons[quantity] || vehicleIcons[4];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center relative">
          <div className="w-full text-center">
            <h2 className="text-lg font-bold text-[#333333]">How Many Seats?</h2>
          </div>
          <button 
            onClick={onClose} 
            className="absolute right-4 text-gray-400 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Illustration & Selection */}
        <div className="p-6 flex flex-col items-center">
          {/* Dynamic Vehicle Graphic */}
          <div className="h-28 flex items-center justify-center mb-6">
            <img 
              src={currentVehicle} 
              alt={`Vehicle for ${quantity} seats`}
              onError={(e) => {
                // Fallback to scooter if specific CDN png fails
                e.target.onerror = null;
                e.target.src = 'https://in.bmscdn.com/webin/common/icons/bicycle.png';
              }}
              className="max-h-24 max-w-[140px] object-contain transition-all duration-300 transform scale-105" 
            />
          </div>
          
          {/* Quantity Circles 1-10 */}
          <div className="flex gap-2 flex-wrap justify-center mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <button
                key={num}
                onClick={() => setQuantity(num)}
                className={`w-9 h-9 rounded-full font-semibold text-sm transition-all flex items-center justify-center
                  ${quantity === num 
                    ? 'bg-[#F84464] text-white shadow-md shadow-pink-500/30 scale-105' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Pricing Tier Details */}
          {showtimeInfo && (
            <div className="w-full bg-[#F5F5F5] rounded-xl p-3 mb-6 flex justify-around text-center text-xs">
              <div>
                <p className="text-gray-500 font-medium uppercase text-[11px]">Executive</p>
                <p className="text-[#333333] font-bold text-sm">₹{showtimeInfo.priceExecutive || 200}</p>
                <p className="text-green-600 font-semibold text-[10px]">AVAILABLE</p>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div>
                <p className="text-gray-500 font-medium uppercase text-[11px]">Premium</p>
                <p className="text-[#333333] font-bold text-sm">₹{showtimeInfo.pricePremium || 350}</p>
                <p className="text-green-600 font-semibold text-[10px]">AVAILABLE</p>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button 
            onClick={() => onConfirm(quantity)}
            className="w-full bg-[#F84464] hover:bg-[#d63a56] text-white py-3 rounded-lg font-semibold text-base transition-colors shadow-lg shadow-pink-500/20 active:scale-[0.99]"
          >
            Select Seats
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatQuantityModal;
