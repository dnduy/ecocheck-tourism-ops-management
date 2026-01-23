
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { db } from '../services/database';
import { useNotification } from './NotificationContext';

interface AuthContextType {
    user: User | null;
    isAuthLoading: boolean;
    login: (user: User) => void;
    updateUser: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const { addNotification } = useNotification();

    // Initialize Auth State from LocalStorage
    useEffect(() => {
        const initAuth = async () => {
            try {
                const apiToken = localStorage.getItem('api_token');
                const currentUser = localStorage.getItem('current_user');

                if (apiToken && currentUser) {
                    try {
                        const parsedUser = JSON.parse(currentUser);
                        if (import.meta.env.DEV) console.log('Found API session, setting user:', parsedUser);
                        setUser(parsedUser);
                    } catch (e) {
                        console.error('Failed to parse user from storage:', e);
                        localStorage.removeItem('current_user');
                    }
                }
            } catch (e) {
                console.error('Auth initialization error:', e);
            } finally {
                setIsAuthLoading(false);
            }
        };
        initAuth();
    }, []);

    // Listen for Token Expiry events
    useEffect(() => {
        const handleTokenExpiry = () => {
            addNotification('Phiên hết hạn', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'CRITICAL');
            setUser(null);
            localStorage.removeItem('api_token');
            localStorage.removeItem('current_user');
        };

        window.addEventListener('tokenExpired', handleTokenExpiry);
        return () => window.removeEventListener('tokenExpired', handleTokenExpiry);
    }, [addNotification]);

    const login = useCallback((userFromLogin: User) => {
        setUser(userFromLogin);
        addNotification('Đăng nhập thành công', `Chào mừng ${userFromLogin.name}!`, 'SUCCESS');
    }, [addNotification]);

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('api_token');
        localStorage.removeItem('current_user');
        db.clearSession();
        addNotification('Đăng xuất', 'Đã đăng xuất thành công', 'NORMAL');
    }, [addNotification]);

    return (
        <AuthContext.Provider value={{ user, isAuthLoading, login, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
