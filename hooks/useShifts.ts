
import { useState, useEffect } from 'react';
import { db } from '../services/database';
import { Shift } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export const useShifts = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const { addNotification } = useNotification();

    useEffect(() => {
        // Basic implementation - load once or subscribe if db supports it
        // Assuming db.shifts is a table/collection
        const loadShifts = async () => {
            // Mock loading or real loading depends on db implementation
            // If db is not fully implemented in snippet, we init empty
            // In previous AppContent, it seemed to just use state.
            // We'll keep it simple for now.
        };
        loadShifts();
    }, []);

    const addShift = async (name: string, startTime: string, endTime: string, type: any, applicableAreaIds: string[]) => {
        const newShift: Shift = { id: `s-${Date.now()}`, name, startTime, endTime, type, applicableAreaIds };
        await db.createShift(newShift);
        setShifts(prev => [...prev, newShift]);
        addNotification('Ca làm việc', `Đã thêm ca: ${name}`, 'SUCCESS');
    };

    const deleteShift = async (id: string) => {
        await db.deleteShift(id);
        setShifts(prev => prev.filter(s => s.id !== id));
    };

    return { shifts, addShift, deleteShift };
};
