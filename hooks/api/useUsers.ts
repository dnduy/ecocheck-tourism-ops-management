
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { User, Role } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { mapApiUser } from '../../services/mappers';

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const resp = await userService.getAll();
            return (resp || []).map(mapApiUser);
        },
        staleTime: 1000 * 60 * 5,
    });
};

export const useUserMutations = () => {
    const queryClient = useQueryClient();
    const { addNotification } = useNotification();

    const createUser = useMutation({
        mutationFn: (data: { name: string; email: string; role: Role; password?: string }) =>
            userService.create(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addNotification('Thêm nhân sự', `Đã thêm tài khoản cho ${data.name}`, 'SUCCESS');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không tạo được người dùng', 'CRITICAL');
        }
    });

    const updateUser = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
            userService.update(Number(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addNotification('Cập nhật', 'Thông tin nhân sự đã được lưu', 'SUCCESS');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không cập nhật được người dùng', 'CRITICAL');
        }
    });

    const deleteUser = useMutation({
        mutationFn: (id: string) => userService.delete(Number(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addNotification('Đã xóa', 'Tài khoản nhân sự đã bị xóa', 'NORMAL');
        },
        onError: (error: any) => {
            addNotification('Lỗi', error.message || 'Không xóa được người dùng', 'CRITICAL');
        }
    });

    return { createUser, updateUser, deleteUser };
};
