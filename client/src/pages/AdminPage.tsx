import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { listingService } from '../services/listingService';
import { Hotel } from '../types';
import { Check, X, MapPin, Home, Train, UtensilsCrossed, ShoppingBag, Trees, Landmark } from 'lucide-react';
import { Button } from '../components/Button';

interface AdminPageProps {
    onLogout: () => void;
}

const NEARBY_CONFIG = {
    attractions: { icon: Landmark, label: "Attractions" },
    public_transport: { icon: Train, label: "Public Transport" },
    restaurants: { icon: UtensilsCrossed, label: "Restaurants" },
    shopping_centers: { icon: ShoppingBag, label: "Shopping Centers" },
    parks: { icon: Trees, label: "Parks" }
};

export const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [pendingListings, setPendingListings] = useState<Hotel[]>([]);
    const [selectedListing, setSelectedListing] = useState<Hotel | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/', { replace: true });
            return;
        }
        loadPendingListings();
    }, []);

    if (!user || user.role !== 'admin') {
        return null; // Return null while redirecting
    }

    const loadPendingListings = async () => {
        setIsLoading(true);
        try {
            const data = await listingService.getPendingListings();
            setPendingListings(data as Hotel[]);
        } catch (error) {
            console.error("Failed to load pending listings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (listingId: number) => {
        try {
            await listingService.approveListing(listingId);
            setPendingListings(prev => prev.filter(l => l.id !== listingId));
            setSelectedListing(null);
        } catch (error) {
            console.error("Failed to approve listing", error);
        }
    };

    const handleDecline = async (listingId: number) => {
        try {
            await listingService.rejectListing(listingId);
            setPendingListings(prev => prev.filter(l => l.id !== listingId));
            setSelectedListing(null);
        } catch (error) {
            console.error("Failed to decline listing", error);
        }
    };
    const handleLogout = () => {
        onLogout();
    };

    return (
        <main className="pb-20 pt-8 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-2">Manage platform content and approvals</p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLogout}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                >
                    Log Out
                </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Stats & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <span className="text-amber-900 font-medium">Pending Approvals</span>
                                <span className="font-bold text-amber-700 bg-white px-2 py-1 rounded-lg shadow-sm">{pendingListings.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Pending Approvals List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Pending Listings</h2>
                                <p className="text-sm text-gray-500 mt-1">Review and approve new properties</p>
                            </div>
                            {pendingListings.length > 0 && (
                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    {pendingListings.length} Pending
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
                                <p>Loading listings...</p>
                            </div>
                        ) : pendingListings.length === 0 ? (
                            <div className="p-16 text-center text-gray-400 bg-white">
                                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                    <Check size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                                <p className="mt-1">No pending listings to review.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {pendingListings.map(listing => (
                                    <div key={listing.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                                        <div className="relative overflow-hidden rounded-lg w-full sm:w-32 h-48 sm:h-24 flex-shrink-0 bg-gray-200">
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-start justify-between">
                                                <h4 className="font-bold text-gray-900 text-lg truncate pr-4">{listing.title}</h4>
                                                <span className="font-semibold text-gray-900 whitespace-nowrap">₺{listing.price}<span className="text-gray-400 text-xs font-normal">/night</span></span>
                                            </div>

                                            <div className="flex flex-wrap items-center text-sm text-gray-500 mt-2 gap-3">
                                                <span className="flex items-center bg-gray-100 px-2 py-1 rounded text-xs font-medium"><MapPin size={12} className="mr-1" /> {listing.city}</span>
                                                <span className="flex items-center bg-gray-100 px-2 py-1 rounded text-xs font-medium"><Home size={12} className="mr-1" /> {listing.property_type}</span>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedListing(listing)}
                                                className="w-full sm:w-auto"
                                            >
                                                Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Inspection Modal */}
            {selectedListing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ring-1 ring-gray-900/5">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Review Listing</h3>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {selectedListing.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedListing(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-0">
                            <div className="relative h-64 sm:h-80 w-full group">
                                <img
                                    src={selectedListing.images[0]}
                                    alt={selectedListing.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                                <div className="absolute bottom-6 left-6 text-white text-shadow-lg">
                                    <h2 className="text-3xl font-bold tracking-tight">{selectedListing.title}</h2>
                                    <p className="flex items-center mt-2 font-medium opacity-90 text-lg">
                                        <MapPin size={20} className="mr-2" /> {selectedListing.city}
                                    </p>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex flex-wrap gap-6 mb-8 text-center text-gray-700">
                                    <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Price</p>
                                        <p className="text-xl font-bold text-gray-900">₺{selectedListing.price}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Guests</p>
                                        <p className="text-xl font-bold text-gray-900">{selectedListing.details?.guests || 1}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Bedrooms</p>
                                        <p className="text-xl font-bold text-gray-900">{selectedListing.details?.rooms || 1}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Bathrooms</p>
                                        <p className="text-xl font-bold text-gray-900">{selectedListing.details?.bathrooms || 1}</p>
                                    </div>
                                </div>

                                <div className="prose prose-gray max-w-none text-gray-600 mb-8">
                                    <h4 className="text-gray-900 font-bold text-lg mb-3">About this place</h4>
                                    <p className="leading-relaxed">{selectedListing.description}</p>
                                </div>

                                <div>
                                    <h4 className="text-gray-900 font-bold text-lg mb-3">Amenities</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedListing.amenities && Object.entries(selectedListing.amenities)
                                            .filter(([_, value]) => value === true)
                                            .map(([amenity, _]) => (
                                                <span key={amenity} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm">
                                                    {amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* Nearby Section */}
                                {selectedListing.nearby && Object.values(selectedListing.nearby).some(val => val === true) && (
                                    <div className="mt-8">
                                        <h4 className="text-gray-900 font-bold text-lg mb-3">What's Nearby</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {Object.entries(selectedListing.nearby)
                                                .filter(([_, value]) => value === true)
                                                .map(([key, _]) => {
                                                    const config = NEARBY_CONFIG[key as keyof typeof NEARBY_CONFIG];
                                                    if (!config) return null;
                                                    const Icon = config.icon;

                                                    return (
                                                        <span key={key} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm flex items-center gap-2">
                                                            <Icon size={16} className="text-amber-600" />
                                                            {config.label}
                                                        </span>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer / Actions */}
                        <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex gap-4">
                            <Button
                                variant="secondary"
                                className="flex-1 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 border-gray-200 hover:border-red-200 py-3"
                                onClick={() => handleDecline(selectedListing.id)}
                            >
                                <X size={20} className="mr-2" />
                                Decline Listing
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 hover:shadow-amber-300 py-3"
                                onClick={() => handleApprove(selectedListing.id)}
                            >
                                <Check size={20} className="mr-2" />
                                Approve & Publish
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};
