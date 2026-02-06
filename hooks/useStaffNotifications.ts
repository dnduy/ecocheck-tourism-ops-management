
import { User, Role } from '../types';
import { runService } from '../services/runService';
import { useNotification } from '../contexts/NotificationContext';

const seenSummaries = new Set<string>();

export const useStaffNotifications = (user: User | null) => {
    const { addNotification } = useNotification();

    const notifyStaffSummary = async () => {
        try {
            if (!user || user.role !== Role.STAFF) return;
            const todayStr = new Date().toISOString().split('T')[0];
            const storageKey = `daily_summary_${user.id}_${todayStr}`;
            if (seenSummaries.has(storageKey)) return;

            const [todayResp, recentResp, tomorrowResp] = await Promise.all([
                runService.list({ date: todayStr, assigned_to: Number(user.id) }),
                runService.list({ assigned_to: Number(user.id) }),
                runService.list({ date: new Date(Date.now() + 86400000).toISOString().split('T')[0], assigned_to: Number(user.id) })
            ]);

            const todayRuns = (todayResp.data || todayResp || []);
            const todayActive = todayRuns.filter((r: any) => ['pending', 'in_progress', 'draft'].includes(r.status));
            const recentRuns = (recentResp.data || recentResp || []);
            const unfinished = recentRuns.filter((r: any) => {
                const d = (r.run_date || todayStr).split('T')[0];
                return (r.status === 'pending' || r.status === 'in_progress') && d < todayStr;
            });
            const tomorrowRuns = (tomorrowResp.data || tomorrowResp || []);

            if (todayActive.length > 0) {
                const top = todayActive.slice(0, 2).map((r: any) => `${r.template?.name || 'Checklist'} • ${r.area?.name || 'Khu vực'}`).join(' | ');
                addNotification('Nhiệm vụ hôm nay', `Bạn có ${todayActive.length} checklist cần làm. ${top ? 'Ví dụ: ' + top : ''}`, 'NORMAL');
            }
            if (unfinished.length > 0) {
                addNotification('Việc chưa hoàn thành', `Còn ${unfinished.length} checklist từ các ngày trước cần hoàn tất`, 'CRITICAL');
            }
            if (tomorrowRuns.length > 0) {
                addNotification('Chuẩn bị cho ngày mai', `Dự kiến có ${tomorrowRuns.length} checklist`, 'NORMAL');
            }
            seenSummaries.add(storageKey);
        } catch (e) {
            console.warn('Staff summary notification failed:', e);
        }
    };

    return { notifyStaffSummary };
};
