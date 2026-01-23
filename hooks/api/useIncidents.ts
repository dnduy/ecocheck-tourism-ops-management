
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentService } from '../../services/incidentService';
import { Incident, IncidentPriority } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

export const useIncidents = () => {
    const { addNotification } = useNotification();

    const query = useQuery({
        queryKey: ['incidents'],
        queryFn: async () => {
            const resp = await incidentService.list();
            // Map API response to Incident type
            return (resp.data || resp || []).map((inc: any) => ({
                id: inc.id,
                title: inc.title,
                description: inc.description || '',
                area_id: inc.area_id,
                area: inc.area?.name || inc.area || '[Khu vực]', // Simple mapping, full resolution might need area list
                priority: (inc.severity || inc.priority || 'medium') as IncidentPriority,
                status: (inc.status || 'open') as any,
                reportedBy: inc.reported_by_name || inc.reported_by || '',
                createdAt: inc.created_at || new Date().toISOString(),
                resolution_note: inc.resolution_note,
                resolved_at: inc.resolved_at,
                resolved_by: inc.resolved_by_name || inc.resolved_by
            }) as Incident);
        },
        refetchInterval: 60000, // Auto-refetch every minute
    });

    return query;
};

export const useIncidentMutations = () => {
    const queryClient = useQueryClient();
    const { addNotification } = useNotification();

    const createIncident = useMutation({
        mutationFn: (data: { area_id: number; title: string; description: string; severity: 'low' | 'medium' | 'high' }) =>
            incidentService.create(data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            const isUrgent = variables.severity === 'high';
            addNotification(
                isUrgent ? 'CẢNH BÁO SỰ CỐ' : 'Sự cố mới',
                `Đã tạo sự cố: ${variables.title}`,
                isUrgent ? 'CRITICAL' : 'NORMAL'
            );
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không tạo được sự cố', 'CRITICAL');
        }
    });

    const updateIncident = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { status?: string, resolution_note?: string } }) =>
            incidentService.update(Number(id), data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            if (variables.data.status === 'resolved') {
                addNotification('Đã xử lý', 'Sự cố đã được đánh dấu hoàn thành', 'SUCCESS');
            }
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không cập nhật được sự cố', 'CRITICAL');
        }
    });

    const assignIncident = useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: number }) =>
            incidentService.assign(Number(id), userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            addNotification('Đã gán', 'Đã phân công xử lý sự cố', 'SUCCESS');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không gán được sự cố', 'CRITICAL');
        }
    });

    return { createIncident, updateIncident, assignIncident };
};
