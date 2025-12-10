// src/layout/Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, Globe, Menu, User as UserIcon, Check, 
  MessageSquare, Map, LogOut 
} from 'lucide-react';
import { User } from '../types';
import { NavSearchBar } from '../components/NavSearchBar';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout?: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  onLogin, 
  onLogout,
  onNavigate, 
  currentPage, 
  searchTerm, 
  onSearchChange, 
  onSearchSubmit,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English");
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    if (onSearchChange) onSearchChange(value);
  };

  const handleSearchSubmit = () => {
    if (onSearchSubmit) onSearchSubmit();
  };

  const handleUserIconClick = () => {
    if (user) {
      setShowUserMenu(!showUserMenu);
      setShowLangMenu(false);
    } else {
      onLogin();
    }
  };

  const handleMenuOption = (page: string) => {
    onNavigate(page);
    setShowUserMenu(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 h-20 px-4 md:px-8 flex items-center justify-between shadow-sm">
      {/* Logo */}
      <div 
        className="flex items-center gap-2 cursor-pointer text-amber-600 hover:text-amber-700 transition-colors"
        onClick={() => onNavigate('home')}
      >
        <div className="bg-amber-500 text-white p-1.5 rounded-lg rotate-3">
          <Home size={24} strokeWidth={2.5} /> 
        </div>
        <span className="text-2xl font-bold tracking-tight text-amber-600 hidden md:block">ituBeeNBee</span>
      </div>

      {/* Middle: Search Bar */}
      <NavSearchBar
          value={searchTerm ?? ""}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
      />

      {/* Right Actions */}
      <div className="flex items-center gap-4" ref={menuRef}>
        <div 
          className="hidden md:block text-sm font-medium text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-full cursor-pointer transition-colors"
          onClick={() => onNavigate('owner-dashboard')}
        >
          Switch to hosting
        </div>
        
        {/* Language/Currency Selector */}
        <div className="relative">
          <div 
            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowUserMenu(false);
            }}
          >
            <Globe size={18} />
          </div>
          
          {showLangMenu && (
            <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl border border-gray-100 w-64 p-4 animate-in fade-in zoom-in-95 duration-200 z-50">
               <div className="mb-4">
                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Language</h4>
                 {['English', 'Turkish'].map(lang => (
                    <div 
                      key={lang}
                      className={`p-2 rounded hover:bg-gray-100 cursor-pointer flex justify-between ${language === lang ? 'font-bold bg-gray-50' : ''}`}
                      onClick={() => setLanguage(lang)}
                    >
                      {lang} {language === lang && <Check size={14}/>}
                    </div>
                 ))}
               </div>
               <div className="border-t pt-2">
                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Currency</h4>
                 {['USD', 'EUR', 'TRY'].map(curr => (
                   <div 
                    key={curr}
                    className={`p-2 rounded hover:bg-gray-100 cursor-pointer flex justify-between ${currency === curr ? 'font-bold bg-gray-50' : ''}`}
                    onClick={() => setCurrency(curr)}
                   >
                     {curr} {currency === curr && <Check size={14}/>}
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
        
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