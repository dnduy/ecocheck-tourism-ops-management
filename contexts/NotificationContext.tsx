
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'CRITICAL' | 'NORMAL' | 'SUCCESS';
    timestamp: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (title: string, message: string, type?: 'CRITICAL' | 'NORMAL' | 'SUCCESS') => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((title: string, message: string, type: 'CRITICAL' | 'NORMAL' | 'SUCCESS' = 'NORMAL') => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification = { id, title, message, type, timestamp: Date.now() };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-remove after 6 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 6000);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
