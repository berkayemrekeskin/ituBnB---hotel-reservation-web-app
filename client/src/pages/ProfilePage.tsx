import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Mail, Phone, Calendar, Edit2, Save, X, Briefcase, Star, Home as HomeIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { userService } from '../services/userService';

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
        phone: '',
        location: '',
        avatar: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Loading profile...');
            const data = await userService.getCurrentUserProfile();
            console.log('Profile data received:', data);
            setProfile(data);
            setFormData({
                name: data.name || '',
                email: data.email || '',
                bio: data.bio || '',
                phone: data.phone || '',
                location: data.location || '',
                avatar: data.avatar || '',
            });
        } catch (err: any) {
            console.error('Error loading profile:', err);
            console.error('Error response:', err.response);

            // Check if it's an authentication error
            if (err.response?.status === 401) {
                setError('Please log in to view your profile');
            } else if (err.response?.status === 404) {
                setError('User profile not found');
            } else {
                setError(err.response?.data?.error || err.message || 'Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            console.log('Saving profile with data:', formData);
            await userService.updateUserProfile(formData);
            console.log('Profile saved successfully');
            await loadProfile();
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error saving profile:', err);
            console.error('Error response:', err.response);
            setError(err.response?.data?.error || err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: profile?.name || '',
            email: profile?.email || '',
            bio: profile?.bio || '',
            phone: profile?.phone || '',
            location: profile?.location || '',
            avatar: profile?.avatar || '',
        });
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const getRoleBadge = (role?: string) => {
        const badges = {
            admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
            host: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Host' },
            user: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Guest' },
        };
        const badge = badges[role as keyof typeof badges] || badges.user;
        return (
            <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-sm font-semibold`}>
                {badge.label}
            </span>
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Recently';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return 'Recently';
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const getAvatarColor = (name?: string) => {
        const colors = [
            'bg-gradient-to-br from-blue-500 to-blue-600',
            'bg-gradient-to-br from-purple-500 to-purple-600',
            'bg-gradient-to-br from-pink-500 to-pink-600',
            'bg-gradient-to-br from-green-500 to-green-600',
            'bg-gradient-to-br from-amber-500 to-orange-600',
            'bg-gradient-to-br from-red-500 to-red-600',
            'bg-gradient-to-br from-indigo-500 to-indigo-600',
        ];
        const index = (name?.charCodeAt(0) || 0) % colors.length;
        return colors[index];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 h-48"></div>
                    <div className="absolute inset-0 h-48 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}></div>

                    <div className="relative pt-24 pb-8 px-8">
                        {/* Profile Picture */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-6">
                            <div className="relative group">
                                {(isEditing ? formData.avatar : profile?.avatar) ? (
                                    <img
                                        src={isEditing ? (formData.avatar || 'https://via.placeholder.com/150') : (profile?.avatar || 'https://via.placeholder.com/150')}
                                        alt={profile?.name}
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover"
                                    />
                                ) : (
                                    <div className={`w-32 h-32 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white text-4xl font-bold ${getAvatarColor(profile?.name)}`}>
                                        {getInitials(profile?.name)}
                                    </div>
                                )}
                                {isEditing && (
                                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center">
                                        <Edit2 className="text-white" size={24} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-center sm:text-left">
                                {isEditing ? (
                                    <div className="mb-2">
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Profile Picture URL</label>
                                        <input
                                            type="text"
                                            value={formData.avatar}
                                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                                            placeholder="Enter image URL"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 mb-2">
                                            <h1 className="text-3xl font-bold text-gray-900">{profile?.name}</h1>
                                            {getRoleBadge(profile?.role)}
                                        </div>
                                        <p className="text-gray-600 flex items-center justify-center sm:justify-start gap-2">
                                            <Calendar size={16} />
                                            Member since {formatDate(profile?.joinDate)}
                                        </p>
                                    </>
                                )}
                            </div>

                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
                                >
                                    <Edit2 size={18} />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold disabled:opacity-50"
                                    >
                                        <Save size={18} />
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 flex items-center gap-2 font-semibold disabled:opacity-50"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className={`grid grid-cols-1 ${profile?.role === 'host' || profile?.role === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-8`}>
                    <button
                        onClick={() => navigate('/trips')}
                        className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 text-left cursor-pointer transform hover:scale-105"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Briefcase className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{profile?.statistics?.trips || 0}</p>
                                <p className="text-gray-600 font-medium">Trips Taken</p>
                            </div>
                        </div>
                    </button>

                    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                <Star className="text-white" size={24} />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{profile?.statistics?.reviews || 0}</p>
                                <p className="text-gray-600 font-medium">Reviews Written</p>
                            </div>
                        </div>
                    </div>

                    {(profile?.role === 'host' || profile?.role === 'admin') && (
                        <button
                            onClick={() => navigate('/owner-dashboard')}
                            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 text-left cursor-pointer transform hover:scale-105"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <HomeIcon className="text-white" size={24} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{profile?.statistics?.listings || 0}</p>
                                    <p className="text-gray-600 font-medium">Listings</p>
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                {/* Profile Information */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <User size={16} />
                                Full Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="Enter your name"
                                />
                            ) : (
                                <p className="text-gray-900 text-lg px-4 py-3 bg-gray-50 rounded-xl">{profile?.name || 'Not set'}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Mail size={16} />
                                Email Address
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="Enter your email"
                                />
                            ) : (
                                <p className="text-gray-900 text-lg px-4 py-3 bg-gray-50 rounded-xl">{profile?.email || 'Not set'}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Phone size={16} />
                                Phone Number
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="Enter your phone number"
                                />
                            ) : (
                                <p className="text-gray-900 text-lg px-4 py-3 bg-gray-50 rounded-xl">{profile?.phone || 'Not set'}</p>
                            )}
                        </div>

                        {/* Location */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <MapPin size={16} />
                                Location
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="Enter your location"
                                />
                            ) : (
                                <p className="text-gray-900 text-lg px-4 py-3 bg-gray-50 rounded-xl">{profile?.location || 'Not set'}</p>
                            )}
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Edit2 size={16} />
                                About Me
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            ) : (
                                <p className="text-gray-900 text-lg px-4 py-3 bg-gray-50 rounded-xl min-h-[100px]">
                                    {profile?.bio || 'No bio added yet'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
