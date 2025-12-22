import { useState, useEffect } from 'react';
import { Navbar } from './layout/Navbar';
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

// Data structure received from the NavSearchBar
interface SearchBarData {
  mode: 'standard' | 'ai';
  destination: string;
  dateRange?: { start: string; end: string };
}

const App = () => {
  const [page, setPage] = useState<string>('home');
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
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({ checkIn: '', checkOut: '', guestCount: 1, total: 0 });

  const handleNavigate = (target: string) => {
    window.scrollTo(0, 0);
    setPage(target);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowAuth(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    handleNavigate('home');
  };

  // --- Search Handlers ---

  const performTraditionalSearch = (term: string, dates?: { start: string, end: string }) => {
    console.log("Standard Search:", { term, dates });
    handleNavigate('search');
  };

  const performAiSearch = (prompt: string) => {
    console.log("AI Search:", { prompt });
    handleNavigate('search');
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
    handleNavigate('detail');
  };

  const handleTripClick = (hotel: Hotel, reservation: any) => {
    setSelectedHotel(hotel);
    setSelectedReservation(reservation);
    handleNavigate('trip-details');
  };

  const handleBook = (details: BookingDetails) => {
    if (!user) {
      setShowAuth(true);
    } else {
      setBookingDetails(details);
      handleNavigate('checkout');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {page !== 'checkout' && (
        <Navbar
          user={user}
          onLogin={() => setShowAuth(true)}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          currentPage={page}
          onSearchSubmit={handleSearchSubmit}
        />
      )}

      {page === 'home' && <HomePage onHotelClick={handleHotelClick} />}

      {page === 'search' && (
        <SearchPage
          searchTerm={lastSearch?.destination || ""}
          onHotelClick={handleHotelClick}
        />
      )}

      {page === 'detail' && selectedHotel && (
        <DetailPage
          hotel={selectedHotel}
          onBack={() => handleNavigate('search')}
          onBook={handleBook}
        />
      )}

      {page === 'success' && (
        <SuccessPage onGoHome={() => handleNavigate('home')} />
      )}

      {page === 'checkout' && selectedHotel && (
        <CheckoutPage
          hotel={selectedHotel}
          bookingDetails={bookingDetails}
          onBack={() => handleNavigate('detail')}
          onConfirm={() => handleNavigate('success')}
        />
      )}

      {page === 'owner-dashboard' && (
        <OwnerDashboard
          onBack={() => handleNavigate('home')}
          onCreate={() => handleNavigate('edit-listing')}
          onEdit={() => handleNavigate('edit-listing')}
        />
      )}

      {page === 'edit-listing' && (
        <ListingEditor
          onBack={() => handleNavigate('owner-dashboard')}
          onSave={(data) => {
            console.log('Listing Data:', data);
            handleNavigate('owner-dashboard');
          }}
        />
      )}

      {page === 'messages' && (
        <MessagesPage onBack={() => handleNavigate('home')} />
      )}

      {page === 'trips' && (
        <MyTripsPage onTripClick={handleTripClick} />
      )}

      {page === 'trip-details' && selectedHotel && selectedReservation && (
        <TripDetailsPage
          hotel={selectedHotel}
          reservation={selectedReservation}
          onBack={() => handleNavigate('trips')}
          onBookAgain={() => handleNavigate('detail')}
          onMessage={() => handleNavigate('messages')}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
    </div>
  );
};

export default App;