
import { useState, useEffect } from 'react';
import { Shift } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { shiftService } from '../services/shiftService';

export const useShifts = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const { addNotification } = useNotification();

    useEffect(() => {
        const loadShifts = async () => {
            try {
                const stored = await shiftService.list();
                setShifts(stored);
            } catch (e) {
                console.error('Failed to load shifts:', e);
                addNotification('Lỗi', 'Không tải được ca làm việc', 'CRITICAL');
            }
        };
        loadShifts();
    }, [addNotification]);

    const addShift = async (name: string, startTime: string, endTime: string, type: any, applicableAreaIds: string[]) => {
        const newShift: Shift = { id: '', name, startTime, endTime, type, applicableAreaIds };
        const created = await shiftService.create(newShift);
        setShifts(prev => [...prev, created]);
        addNotification('Ca làm việc', `Đã thêm ca: ${name}`, 'SUCCESS');
    };

    const deleteShift = async (id: string) => {
        await shiftService.delete(id);
        setShifts(prev => prev.filter(s => String(s.id) !== String(id)));
    };

    return { shifts, addShift, deleteShift };
};
