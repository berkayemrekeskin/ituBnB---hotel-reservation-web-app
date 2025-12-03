// src/layout/Navbar.tsx
import React, { useState } from 'react';
import { Home, Search, Globe, Menu, User as UserIcon, Check } from 'lucide-react';
import { User } from '../types';
import { NavSearchBar } from '../components/NavSearchBar';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;

  // searchbar için yeni eklenen
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;

}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogin, onNavigate, currentPage, searchTerm, onSearchChange, onSearchSubmit,}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("English");

  const handleSearchChange = (value: string) => {
    if (onSearchChange) onSearchChange(value);
  };

  const handleSearchSubmit = () => {
    if (onSearchSubmit) onSearchSubmit();
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

      {/* Orta: Search Bar */}
      <NavSearchBar
          value={searchTerm ?? ""}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
      />

      {/* Right Actions */}
      <div className="flex items-center gap-4">
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
            onClick={() => setShowLangMenu(!showLangMenu)}
          >
            <Globe size={18} />
          </div>
          
          {showLangMenu && (
            <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl border border-gray-100 w-64 p-4 animate-in fade-in zoom-in-95 duration-200">
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
        
        {/* User Menu */}
        <div 
          className="flex items-center gap-2 border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow cursor-pointer"
          onClick={onLogin}
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
      </div>
    </nav>
  );
};