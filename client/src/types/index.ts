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
  id: string;
  title: string;
  city: string;
  property_type: string;
  price: number;
  rating: number;
  reviews: number;
  superhost: boolean;
  images: string[];
  description: string;
  status?: 'pending' | 'approved' | 'rejected';
  amenities?: {
    wifi: boolean;
    kitchen: boolean;
    heating: boolean;
    air_conditioning: boolean;
    washer: boolean;
    dryer: boolean;
    free_parking: boolean;
    pool: boolean;
    gym: boolean;
    pet_friendly: boolean;
  };
  details?: {
    guests: number;
    rooms: number;
    beds: number;
    bathrooms: number;
  };
  nearby?: {
    attractions: boolean | null;
    public_transport: boolean | null;
    restaurants: boolean | null;
    shopping_centers: boolean | null;
    parks: boolean | null;
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
