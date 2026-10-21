const Contact = () => {
  return (
    <div className="min-h-[70vh] bg-[#F5F5F5] flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-[#333333] mb-4">Contact Us Today!</h1>
      <p className="text-gray-600 text-lg max-w-2xl text-center mb-8">
        We're here to help. Reach out to our 24/7 customer support team for any queries regarding your bookings.
      </p>
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-5 text-left w-full max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input type="email" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#F84464] focus:ring-2 focus:ring-[#F84464] focus:ring-opacity-20 transition-all" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#F84464] focus:ring-2 focus:ring-[#F84464] focus:ring-opacity-20 transition-all h-32 resize-none" placeholder="How can we help?"></textarea>
        </div>
        <button className="w-full bg-[#F84464] text-white p-3.5 rounded-xl font-bold text-lg hover:bg-[#d63a56] transition-colors flex justify-center items-center mt-2 shadow-md shadow-red-500/30">
          Send Message
        </button>
      </div>
    </div>
  );
};
export default Contact;
