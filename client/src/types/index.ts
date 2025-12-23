// client/src/types/index.ts

// test için eklendi user type'a göre değişebilir
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

export interface Hotel {
  id: number;
  title: string;
  location: string;
  type: string;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  price: number;
  rating: number;
  reviews: number;
  superhost: boolean;
  images: string[];
  amenities: string[];
  description: string;
  status?: 'pending' | 'approved' | 'rejected';
  nearby?: {
    attractions: string[] | null;
    public_transport: string[] | null;
    restaurants: string[] | null;
    shopping_centers: string[] | null;
    parks: string[] | null;
  };
}

export interface BookingDetails {
  checkIn: string;
  checkOut: string;
  guestCount: number;
  total: number;
}


export interface Booking {
  id: string;
  hotelId: number;
  hotelTitle: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  total: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
}
