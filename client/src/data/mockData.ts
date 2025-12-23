// src/data/mockData.ts
import { Hotel, User, Booking } from '../types';

export const MOCK_USER: User = {
  id: "u1",
  name: "Emir Buğra",
  email: "emir@example.com",
  role: "host",
  avatar: "https://i.pravatar.cc/150?img=11"
};

export const MOCK_HOTELS: Hotel[] = [
  {
    id: 1,
    title: "Luxury Bosphorus Suite with View",
    location: "Beşiktaş, İstanbul",
    type: "Entire apartment",
    guests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    price: 2500,
    rating: 4.92,
    reviews: 128,
    superhost: true,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    ],
    amenities: ["Wifi", "Kitchen", "Washer", "Air conditioning", "Sea view"],
    description: "Experience the magic of the city from this stunning suite overlooking the Bosphorus."
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    hotelId: 1,
    hotelTitle: "Luxury Bosphorus Suite with View",
    guestName: "John Doe",
    checkIn: "2024-02-10",
    checkOut: "2024-02-15",
    total: 12500,
    status: 'pending'
  },
  {
    id: 'b2',
    hotelId: 2,
    hotelTitle: "Cosy Studio in Kadikoy",
    guestName: "Alice Wonderland",
    checkIn: "2024-04-20",
    checkOut: "2024-04-22",
    total: 4500,
    status: 'pending'
  },
  {
    id: 'b3',
    hotelId: 1,
    hotelTitle: "Luxury Bosphorus Suite with View",
    guestName: "Michael Scott",
    checkIn: "2024-05-10",
    checkOut: "2024-05-15",
    total: 15000,
    status: 'accepted'
  }
];