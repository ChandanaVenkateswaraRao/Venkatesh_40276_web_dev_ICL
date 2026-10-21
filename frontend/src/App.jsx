import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LocationProvider } from './context/LocationContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Movie from './pages/Movie';
import Theaters from './pages/Theaters';
import Booking from './pages/Booking';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ListYourShow from './pages/ListYourShow';
import Corporates from './pages/Corporates';
import Offers from './pages/Offers';
import GiftCards from './pages/GiftCards';
import Contact from './pages/Contact';

import Footer from './components/Footer';
import AdminLayout from './pages/admin/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTheaters from './pages/admin/AdminTheaters';
import Addshow from './pages/admin/Addshow';
import Listbookings from './pages/admin/Listbookings';
import AdminScanner from './pages/admin/AdminScanner';
import PartnerLogin from './pages/partner/PartnerLogin';
import PartnerDashboard from './pages/partner/PartnerDashboard';

function App() {
  return (
    <LocationProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/movie/:id" element={<Movie />} />
          <Route path="/buytickets/:id" element={<Theaters />} />
          <Route path="/book/:id" element={<Booking />} />
          
          <Route path="/list-your-show" element={<ListYourShow />} />
          <Route path="/corporates" element={<Corporates />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/gift-cards" element={<GiftCards />} />
          <Route path="/contact" element={<Contact />} />

          {/* Theater Partner Portal Routes */}
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          <Route path="/theater/login" element={<PartnerLogin />} />
          <Route path="/theater/dashboard" element={<PartnerDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="theaters" element={<AdminTheaters />} />
            <Route path="add-show" element={<Addshow />} />
            <Route path="bookings" element={<Listbookings />} />
            <Route path="scanner" element={<AdminScanner />} />
          </Route>
        </Routes>
        <Footer />
      </Router>
    </LocationProvider>
  );
}

export default App;
