
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runService } from '../../services/runService';
import { Checklist } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { useAreas } from './useAreas';
import { mapRunToChecklist } from '../../services/mappers';

export const useChecklists = (filters?: { assigned_to?: number; date?: string; status?: string }) => {
    const { data: areas = [] } = useAreas();

    return useQuery({
        queryKey: ['checklists', filters, areas],
        queryFn: async () => {
            const resp = await runService.list({ ...filters, per_page: 1000 });
            const apiRuns: any[] = resp.data || resp || [];
            return apiRuns.map(run => mapRunToChecklist(run, areas));
        },
        // enabled: areas.length > 0, // Removed to allow fetching without areas
        refetchInterval: 60000,
    });
};

export const useChecklistMutations = () => {
    const queryClient = useQueryClient();
    const { addNotification } = useNotification();

    const createChecklist = useMutation({
        mutationFn: (data: { areaId: number; date: string }) =>
            runService.create(data.areaId, data.date),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists'] });
            addNotification('Checklist Mới', 'Đã tạo checklist', 'SUCCESS');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không tạo được checklist', 'CRITICAL');
        }
    });

    const assignChecklist = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { assigned_to?: number; verified_by?: number } }) =>
            runService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklists'] });
            addNotification('Phân công', 'Đã cập nhật phân công checklist', 'SUCCESS');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không cập nhật được phân công', 'CRITICAL');
        }
    });

    return { createChecklist, assignChecklist };
};
