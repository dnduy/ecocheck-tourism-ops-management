
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '../../services/templateService';
import { useNotification } from '../../contexts/NotificationContext';

export const useTemplates = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['templates'],
        queryFn: async () => {
            const resp = await templateService.list();
            return resp || [];
        },
        staleTime: 1000 * 60 * 5,
        enabled: options?.enabled ?? true,
    });
};

export const useTemplateMutations = () => {
    const queryClient = useQueryClient();
    const { addNotification } = useNotification();

    const createTemplate = useMutation({
        mutationFn: (data: any) => templateService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            addNotification('Template', 'Đã tạo mẫu checklist mới', 'SUCCESS');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không tạo được template', 'CRITICAL');
        }
    });

    return { createTemplate };
};
