import { useState } from 'react';
import { X, Plus, Minus, Utensils, HeartHandshake, ShieldCheck } from 'lucide-react';

const fnbMenu = [
  {
    id: 'c1',
    name: 'Coke & Popcorn Duo Combo',
    category: 'Combos',
    price: 340,
    desc: '1 Regular Salted Popcorn + 1 Pepsi 500ml',
    image: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'c2',
    name: 'Family Mega Saver Combo',
    category: 'Combos',
    price: 590,
    desc: '2 Large Popcorn (Cheese & Caramel) + 2 Pepsi 500ml',
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'p1',
    name: 'Golden Salted Popcorn (Regular)',
    category: 'Popcorn',
    price: 180,
    desc: 'Classic salted freshly popped hot popcorn',
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'p2',
    name: 'Crispy Cheese Burst Popcorn',
    category: 'Popcorn',
    price: 240,
    desc: 'Loaded with rich melted cheddar cheese seasoning',
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'b1',
    name: 'Chilled Pepsi (500ml)',
    category: 'Beverages',
    price: 120,
    desc: 'Ice-cold carbonated refreshment',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 'b2',
    name: 'Minute Maid Pulpy Orange',
    category: 'Beverages',
    price: 130,
    desc: 'Real orange pulp fruit juice',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=60'
  },
  {
    id: 's1',
    name: 'Cheesy Salsa Nachos',
    category: 'Snacks',
    price: 210,
    desc: 'Crisp tortilla corn chips served with warm cheese & tang salsa',
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300&auto=format&fit=crop&q=60'
  }
];

const categories = ['All', 'Combos', 'Popcorn', 'Beverages', 'Snacks'];

const FoodAndBeverageModal = ({ isOpen, onClose, ticketTotal, onProceedToPayment }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [donateBookASmile, setDonateBookASmile] = useState(true);

  if (!isOpen) return null;

  const addItem = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeItem = (id) => {
    setCart(prev => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const fnbTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = fnbMenu.find(m => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const convenienceFee = 30;
  const gst = 5.4; // 18% GST on convenience fee
  const donation = donateBookASmile ? 1 : 0;
  const grandTotal = Math.round(ticketTotal + fnbTotal + convenienceFee + gst + donation);

  const filteredItems = selectedCategory === 'All' 
    ? fnbMenu 
    : fnbMenu.filter(item => item.category === selectedCategory);

  const handlePay = () => {
    onProceedToPayment({
      fnbTotal,
      grandTotal,
      cartItems: Object.entries(cart).map(([id, qty]) => ({
        ...fnbMenu.find(m => m.id === id),
        qty
      }))
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#1F2533] text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#F84464]" />
            <div>
              <h2 className="text-lg font-bold">Grab a Bite!</h2>
              <p className="text-xs text-gray-300">Pre-book your movie snacks & skip the concession queues</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split into Menu and Order Summary */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          
          {/* Left Column: Snacks Menu */}
          <div className="flex-1 p-5 md:p-6 border-r border-gray-100">
            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer
                    ${selectedCategory === cat 
                      ? 'bg-[#F84464] text-white shadow-xs' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map(item => {
                const qty = cart[item.id] || 0;

                return (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-3 flex gap-3 hover:border-gray-300 transition-all">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100" 
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-[#222222] line-clamp-1">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{item.desc}</p>
                        <p className="font-bold text-xs text-[#222222] mt-1">₹{item.price}</p>
                      </div>

                      {/* Add/Quantity Counter */}
                      <div className="self-end mt-1">
                        {qty === 0 ? (
                          <button
                            onClick={() => addItem(item.id)}
                            className="bg-white border border-[#F84464] text-[#F84464] hover:bg-pink-50 text-xs font-bold px-3 py-1 rounded-md transition-colors"
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-[#F84464] text-white rounded-md px-2 py-0.5 text-xs font-bold shadow-xs">
                            <button onClick={() => removeItem(item.id)} className="hover:opacity-80">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span>{qty}</span>
                            <button onClick={() => addItem(item.id)} className="hover:opacity-80">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Summary & Bill Details */}
          <div className="w-full md:w-80 bg-[#FAF9F8] p-5 md:p-6 flex flex-col justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-sm text-[#333333] mb-4 uppercase tracking-wider text-xs border-b pb-2">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Tickets Subtotal</span>
                  <span className="font-semibold text-gray-800">₹{ticketTotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Food & Beverage</span>
                  <span className="font-semibold text-gray-800">₹{fnbTotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Convenience Fee</span>
                  <span className="font-semibold text-gray-800">₹{convenienceFee}</span>
                </div>

                <div className="flex justify-between">
                  <span>Integrated GST (18%)</span>
                  <span className="font-semibold text-gray-800">₹{gst}</span>
                </div>

                {/* BookASmile Donation */}
                <div className="pt-2 border-t flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={donateBookASmile}
                      onChange={(e) => setDonateBookASmile(e.target.checked)}
                      className="accent-[#F84464] rounded cursor-pointer"
                    />
                    <span className="text-[11px] text-gray-700 flex items-center gap-1 font-medium">
                      <HeartHandshake className="w-3.5 h-3.5 text-[#F84464]" />
                      Donate ₹1 to BookASmile
                    </span>
                  </label>
                  <span className="font-semibold text-gray-800 text-xs">₹{donation}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="mt-6 pt-3 border-t-2 border-dashed border-gray-300 flex justify-between items-baseline">
                <span className="font-bold text-sm text-gray-800">Amount Payable</span>
                <span className="font-black text-xl text-[#F84464]">₹{grandTotal}</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 p-2 rounded-lg">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-green-600" />
                <span>100% Secure Transaction via Razorpay</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t flex flex-col gap-2">
              <button
                onClick={handlePay}
                className="w-full bg-[#F84464] hover:bg-[#d63a56] text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-pink-500/20 active:scale-[0.99] cursor-pointer"
              >
                Proceed to Pay ₹{grandTotal}
              </button>

              <button
                onClick={() => {
                  // Pay without F&B
                  onProceedToPayment({
                    fnbTotal: 0,
                    grandTotal: Math.round(ticketTotal + convenienceFee + gst + donation),
                    cartItems: []
                  });
                }}
                className="w-full text-xs text-gray-500 hover:text-gray-800 py-1 font-medium transition-colors cursor-pointer"
              >
                Skip F&B & Continue
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default FoodAndBeverageModal;
