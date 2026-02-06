
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNotification } from './NotificationContext';
import { authStore } from '../services/authStore';

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

    // Initialize Auth State from in-memory store
    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = authStore.getUser();
                if (currentUser) {
                    if (import.meta.env.DEV) console.log('Found API session (memory), setting user:', currentUser);
                    setUser(currentUser);
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
            authStore.clear();
        };

        window.addEventListener('tokenExpired', handleTokenExpiry);
        return () => window.removeEventListener('tokenExpired', handleTokenExpiry);
    }, [addNotification]);

    const login = useCallback((userFromLogin: User) => {
        setUser(userFromLogin);
        authStore.setUser(userFromLogin);
        addNotification('Đăng nhập thành công', `Chào mừng ${userFromLogin.name}!`, 'SUCCESS');
    }, [addNotification]);

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        authStore.setUser(updatedUser);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        authStore.clear();
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
