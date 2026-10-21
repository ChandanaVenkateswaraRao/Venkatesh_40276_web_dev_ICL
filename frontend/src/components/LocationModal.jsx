import { X } from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';

const cities = [
  "Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Chandigarh",
  "Ahmedabad", "Chennai", "Pune", "Kolkata", "Kochi"
];

const LocationModal = ({ isOpen, onClose }) => {
  const { city, setCity } = useLocationContext();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-[#333333]">Pick a City</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* City Grid */}
        <div className="p-8">
          <h3 className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-6 text-center">Popular Cities</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {cities.map(c => (
              <div 
                key={c}
                onClick={() => {
                  setCity(c);
                  onClose();
                }}
                className="flex flex-col items-center justify-center cursor-pointer group"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${city === c ? 'bg-[#F84464] shadow-lg scale-110' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                   {/* We use initials or a generic building icon, but initials are fine for now */}
                   <span className={`text-xl font-bold ${city === c ? 'text-white' : 'text-gray-600'}`}>{c.substring(0,2).toUpperCase()}</span>
                </div>
                <span className={`text-sm text-center ${city === c ? 'text-[#F84464] font-bold' : 'text-gray-700'}`}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
