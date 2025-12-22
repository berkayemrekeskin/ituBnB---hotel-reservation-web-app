// src/components/Button.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50";

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  const variants = {
    primary: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-600 hover:bg-gray-100",
    outline: "border-2 border-gray-900 text-gray-900 hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };

  return (
    <button
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 18} className="mr-2" />}
      {children}
    </button>
  );
};