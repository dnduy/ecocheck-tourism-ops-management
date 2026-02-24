
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { areaService } from '../../services/areaService';
import { Area } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

export const useAreas = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const resp = await areaService.getAll();
            return (resp || []).map((area: any) => ({
                id: area.id,
                name: area.name,
                type: area.type || 'GENERAL',
                description: area.description || ''
            } as Area));
        },
        staleTime: 1000 * 60 * 5, // Areas don't change often
        enabled: options?.enabled ?? true,
    });
};

export const useAreaMutations = () => {
    const queryClient = useQueryClient();
    const { addNotification } = useNotification();

    const createArea = useMutation({
        mutationFn: (data: { name: string; type: string }) => areaService.create(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            addNotification('Khu vực', `Đã thêm khu vực: ${data.name}`, 'SUCCESS');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không tạo được khu vực', 'CRITICAL');
        }
    });

    const updateArea = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name: string; type: string } }) =>
            areaService.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            addNotification('Cập nhật', `Đã lưu khu vực: ${data.name}`, 'SUCCESS');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không cập nhật được khu vực', 'CRITICAL');
        }
    });

    const deleteArea = useMutation({
        mutationFn: (id: number) => areaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            addNotification('Đã xóa', 'Khu vực đã được xóa', 'NORMAL');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không xóa được khu vực', 'CRITICAL');
        }
    });

    return { createArea, updateArea, deleteArea };
};
