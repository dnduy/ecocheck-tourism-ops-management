
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNotification } from './NotificationContext';
import { authStore } from '../services/authStore';
import { authService } from '../services/authService';

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

    // Initialize Auth State from cookie-backed token
    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = authStore.getUser();
                const token = authStore.getToken();
                if (currentUser) {
                    if (import.meta.env.DEV) console.log('Found cached user, setting user:', currentUser);
                    setUser(currentUser);
                    // If we still have a token, try to refresh /me in background
                    if (token) {
                        try {
                            if (import.meta.env.DEV) console.log('Refreshing /me with cached token');
                            const me = await authService.getMe();
                            setUser(me);
                            authStore.setUser(me);
                        } catch (e) {
                            console.warn('Background /me refresh failed:', e);
                        }
                    }
                    return;
                }
                if (token) {
                    // Re-hydrate user from API if token exists in cookie
                    if (import.meta.env.DEV) console.log('Found API token (cookie), fetching /me');
                    const me = await authService.getMe();
                    setUser(me);
                    authStore.setUser(me);
                }
            } catch (e) {
                console.error('Auth initialization error:', e);
                authStore.clear();
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
