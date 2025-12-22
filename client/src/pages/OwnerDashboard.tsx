import React, { useState } from 'react';
import { Plus, Edit } from 'lucide-react';
import { Button } from '../components/Button';
import { MOCK_HOTELS } from '../data/mockData';
import { Hotel } from '../types';

interface OwnerDashboardProps {
  onBack: () => void;
  onCreate: () => void;
  onEdit: (id: string | number) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onCreate, onEdit }) => {
  // In a real app, you would fetch this from an API
  const [listings] = useState<Hotel[]>(MOCK_HOTELS.slice(0, 2));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Host Dashboard</h1>
        <Button variant="primary" icon={Plus} onClick={onCreate}>Create new listing</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-2">Pending Reservations</div>
          <div className="text-3xl font-bold">4</div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-2">Total Revenue (Nov)</div>
          <div className="text-3xl font-bold">₺45,250</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Your listings</h2>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b">
            <tr>
              <th className="p-4">Property</th>
              <th className="p-4">Location</th>
              <th className="p-4">Price</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {listings.map(hotel => (
              <tr key={hotel.id} className="hover:bg-gray-50">
                <td className="p-4 flex items-center gap-3">
                  <img src={hotel.images[0]} className="w-12 h-12 rounded object-cover" alt="thumb" />
                  <span className="font-medium">{hotel.title}</span>
                </td>
                <td className="p-4 text-gray-600">{hotel.location}</td>
                <td className="p-4">₺{hotel.price}</td>
                <td className="p-4">
                  <button onClick={() => onEdit(hotel.id)} className="text-amber-600 font-medium hover:underline flex items-center gap-1">
                    <Edit size={14} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};