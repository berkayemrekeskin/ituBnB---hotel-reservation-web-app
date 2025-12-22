import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Menu, User as UserIcon,
  MessageSquare, Map, LogOut
} from 'lucide-react';
import { User } from '../types';
import { NavSearchBar } from '../components/NavSearchBar';

// This matches the data structure coming from NavSearchBar
interface SearchBarData {
  mode: 'standard' | 'ai';
  destination: string;
  dateRange?: { start: string; end: string };
}

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout?: () => void;
  onSearchSubmit: (data: SearchBarData) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogin,
  onLogout,
  onSearchSubmit,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserIconClick = () => {
    if (user) {
      setShowUserMenu(!showUserMenu);
    } else {
      onLogin();
    }
  };

  const handleMenuOption = (page: string) => {
    navigate(`/${page}`);
    setShowUserMenu(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 h-20 px-4 md:px-8 flex items-center justify-between shadow-sm">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer text-amber-600 hover:text-amber-700 transition-colors"
        onClick={() => navigate('/')}
      >
        <div className="bg-amber-500 text-white p-1.5 rounded-lg rotate-3">
          <Home size={24} strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-bold tracking-tight text-amber-600 hidden md:block">ituBeeNBee</span>
      </div>

      {/* Middle: Search Bar */}
      <NavSearchBar onSubmit={onSearchSubmit} />

      {/* Right Actions */}
      <div className="flex items-center gap-4" ref={menuRef}>
        {user && (
          <div
            className="hidden md:block text-sm font-medium text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full cursor-pointer transition-colors"
            onClick={() => {
              if (location.pathname.startsWith('/owner-dashboard')) {
                navigate('/');
              } else {
                navigate('/owner-dashboard');
              }
            }}
          >
            {location.pathname.startsWith('/owner-dashboard') ? 'Switch to traveling' : 'Switch to hosting'}
          </div>
        )}

        {/* User Menu Trigger */}
        <div className="relative">
          <div
            className={`flex items-center gap-2 border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow cursor-pointer ${showUserMenu ? 'shadow-md ring-2 ring-gray-100' : ''}`}
            onClick={handleUserIconClick}
          >
            <Menu size={18} className="text-gray-600" />
            {user ? (
              <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="bg-gray-500 text-white rounded-full p-1">
                <UserIcon size={18} fill="currentColor" />
              </div>
            )}
          </div>

          {/* Logged In User Dropdown */}
          {showUserMenu && user && (
            <div className="absolute top-14 right-0 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 w-60 py-2 animate-in fade-in zoom-in-95 duration-200 z-50 overflow-hidden">

              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-sm">Hello, {user.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>

              <div className="py-2">
                <button
                  onClick={() => handleMenuOption('trips')}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-gray-700 transition-colors"
                >
                  <Map size={16} />
                  My Trips
                </button>

                <button
                  onClick={() => handleMenuOption('messages')}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-gray-700 transition-colors"
                >
                  <MessageSquare size={16} />
                  Messages
                </button>
              </div>

              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={() => {
                    if (onLogout) onLogout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-red-600 transition-colors"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};