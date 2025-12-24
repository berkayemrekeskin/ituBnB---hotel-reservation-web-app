// src/features/hotels/HotelCard.tsx
import React from 'react';
import { Heart, Star } from 'lucide-react';
import { Hotel } from '../../types';

interface HotelCardProps {
  hotel: Hotel;
  onClick: (hotel: Hotel) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, onClick }) => (
  <div className="group cursor-pointer" onClick={() => onClick(hotel)}>
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200 mb-3">
      <img
        src={hotel.images[0]}
        alt={hotel.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <button className="absolute top-3 right-3 text-white/70 hover:text-white hover:scale-110 transition-all">
        <Heart size={24} fill="rgba(0,0,0,0.5)" />
      </button>
      {hotel.superhost && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm text-xs font-bold text-gray-800">
          Superhost
        </div>
      )}
    </div>
    <div className="flex justify-between items-start mb-1">
      <h3 className="font-semibold text-gray-900 line-clamp-1">{hotel.city}</h3>
      <div className="flex items-center gap-1 text-sm">
        <Star size={14} className="fill-black text-black" />
        <span>{hotel.rating}</span>
      </div>
    </div>
    <p className="text-gray-500 text-sm mb-1">{hotel.property_type}</p>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="font-semibold text-gray-900">₺{hotel.price}</span>
      <span className="text-gray-900">night</span>
    </div>
  </div>
);