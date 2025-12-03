// src/components/NavSearchBar.tsx
import React from "react";
import { Search } from "lucide-react";

type NavSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export const NavSearchBar: React.FC<NavSearchBarProps> = ({
  value,
  onChange,
  onSubmit,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <div className="hidden md:flex flex-1 justify-center px-4 md:px-12">
      <div className="flex w-full max-w-2xl items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search by city, location or stay name"
          className="flex-1 bg-transparent text-sm md:text-base outline-none placeholder:text-gray-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="rounded-full px-4 py-1 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors"
          onClick={onSubmit}
        >
          Search
        </button>
      </div>
    </div>
  );
};
