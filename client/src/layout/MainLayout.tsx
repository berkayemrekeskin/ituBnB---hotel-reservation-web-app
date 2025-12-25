import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { User } from '../types';

interface MainLayoutProps {
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
    onSearchSubmit: (data: any) => void;
    onSearchChange?: (value: string) => void; // ✅ Real-time search callback
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    user,
    onLogin,
    onLogout,
    onSearchSubmit,
    onSearchChange, // ✅ Destructure callback
}) => {
    return (
        <>
            <Navbar
                user={user}
                onLogin={onLogin}
                onLogout={onLogout}
                onSearchSubmit={onSearchSubmit}
                onSearchChange={onSearchChange} // ✅ Pass to Navbar
            />
            <Outlet />
        </>
    );
};
