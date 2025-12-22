import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { HomePage } from './pages/Home';
import { SearchPage } from './pages/Search';
import { DetailPage } from './pages/Detail';
import { CheckoutPage } from './pages/Checkout';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { MessagesPage } from './pages/Messages';
import { ListingEditor } from './pages/ListingEditor';
import { MyTripsPage } from './pages/MyTripsPage';
import { TripDetailsPage } from './pages/TripDetails';
import { SuccessPage } from './pages/SuccessPage';
import { AuthModal } from './features/auth/AuthModal';
import { User, Hotel, BookingDetails } from './types';
import { authService } from './services/authService';
import { AdminPage } from './pages/AdminPage';

// Data structure received from the NavSearchBar
interface SearchBarData {
  mode: 'standard' | 'ai';
  destination: string;
  dateRange?: { start: string; end: string };
}

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Restore user session on app load
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
  }, []);

  // Store the submitted search to pass to results page
  const [lastSearch, setLastSearch] = useState<SearchBarData | null>(null);

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({ checkIn: '', checkOut: '', guestCount: 1, total: 0 });

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowAuth(false);
    if (userData.role === 'admin') {
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/');
  };

  // --- Search Handlers ---

  const performTraditionalSearch = (term: string, dates?: { start: string, end: string }) => {
    console.log("Standard Search:", { term, dates });
    navigate('/search');
  };

  const performAiSearch = (prompt: string) => {
    console.log("AI Search:", { prompt });
    navigate('/search');
  };

  const handleSearchSubmit = (data: SearchBarData) => {
    setLastSearch(data);

    if (data.mode === 'ai') {
      performAiSearch(data.destination);
    } else {
      performTraditionalSearch(data.destination, data.dateRange);
    }
  };

  // --- Booking Flow ---

  const handleHotelClick = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    navigate(`/hotel/${hotel.id}`, { state: { hotel } });
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/trips/${tripId}`);
  };

  const handleBook = (hotel: Hotel, details: BookingDetails) => {
    if (!user) {
      setShowAuth(true);
    } else {
      setSelectedHotel(hotel);
      setBookingDetails(details);
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Routes>
        <Route path="/admin" element={<AdminPage onLogout={handleLogout} />} />

        <Route element={
          <MainLayout
            user={user}
            onLogin={() => setShowAuth(true)}
            onLogout={handleLogout}
            onSearchSubmit={handleSearchSubmit}
          />
        }>
          <Route path="/" element={<HomePage onHotelClick={handleHotelClick} />} />

          <Route path="/search" element={
            <SearchPage
              searchTerm={lastSearch?.destination || ""}
              onHotelClick={handleHotelClick}
            />
          } />

          <Route path="/hotel/:id" element={
            <DetailPage
              hotel={selectedHotel || undefined}
              onBack={() => navigate(-1)}
              onBook={handleBook}
            />
          } />

          <Route path="/checkout" element={
            selectedHotel ? (
              <CheckoutPage
                hotel={selectedHotel}
                bookingDetails={bookingDetails}
                onBack={() => navigate(-1)}
                onConfirm={() => navigate('/success')}
              />
            ) : (
              <HomePage onHotelClick={handleHotelClick} />
            )
          } />

          <Route path="/success" element={<SuccessPage onGoHome={() => navigate('/')} />} />

          <Route path="/owner-dashboard" element={
            <OwnerDashboard
              onBack={() => navigate('/')}
              onCreate={() => navigate('/edit-listing')}
              onEdit={() => navigate('/edit-listing')}
            />
          } />

          <Route path="/edit-listing" element={
            <ListingEditor
              onBack={() => navigate('/owner-dashboard')}
              onSave={(data) => {
                console.log('Listing Data:', data);
                navigate('/owner-dashboard');
              }}
            />
          } />

          <Route path="/messages" element={
            <MessagesPage onBack={() => navigate('/')} />
          } />

          <Route path="/trips" element={
            <MyTripsPage onTripClick={handleTripClick} />
          } />

          <Route path="/trips/:id" element={
            <TripDetailsPage />
          } />
        </Route>
      </Routes>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
    </div>
  );
};

export default App;