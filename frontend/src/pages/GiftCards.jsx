const GiftCards = () => {
  return (
    <div className="min-h-[70vh] bg-[#F5F5F5] flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-[#333333] mb-4">Gift Cards</h1>
      <p className="text-gray-600 text-lg max-w-2xl text-center">
        Gift the joy of entertainment! Buy e-gift cards for your loved ones for movies, events, and plays.
      </p>
      <button className="mt-8 bg-[#F84464] hover:bg-[#d63a56] text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-md">
        Buy Gift Card
      </button>
    </div>
  );
};
export default GiftCards;
