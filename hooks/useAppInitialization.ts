
import { useState, useEffect } from 'react';
import { User, Checklist, Incident, Area, Shift, Role, ChecklistStatus, WorkStatus, IncidentPriority, ChecklistItem } from '../types';
import { userService } from '../services/userService';
import { templateService } from '../services/templateService';
import { areaService } from '../services/areaService';
import { incidentService } from '../services/incidentService';
import { runService } from '../services/runService';
import { getErrorMessage } from '../services/errorUtils';

const seenStaffSummaries = new Set<string>();

export const useAppInitialization = (user: User | null, isAuthLoading: boolean, addNotification: (t: string, m: string, type: any) => void) => {
    const [users, setUsers] = useState<User[]>([]);
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [pendingReviewCount, setPendingReviewCount] = useState(0);

    // UUID-based request tracking
    const [runsFetchId, setRunsFetchId] = useState<string>('');
    const [incidentsFetchId, setIncidentsFetchId] = useState<string>('');

    const reportError = (label: string, err: unknown, fallback: string) => {
        console.error(label, err);
        addNotification('Lỗi', getErrorMessage(err, fallback), 'CRITICAL');
    };

    // --- MAPPERS ---
    const mapApiUser = (u: any): User => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff`
    });

    const mapItemStatus = (value?: string): ChecklistItem['status'] => {
        if (value === 'ok') return 'PASS';
        if (value === 'not_ok') return 'FAIL';
        return undefined;
    };

    const mapRunToChecklist = (runData: any, areaList: Area[]): Checklist => {
        const run = runData.run || runData;
        const template = runData.template;
        const entries = runData.entries || [];
        const items = runData.items || [];

        const areaId = run.area_id;
        const area = areaList.find(a => String(a.id) === String(areaId)) || {
            id: areaId || `area-${run.id}`,
            name: run.area?.name || runData.area?.name || '[Khu vực được xoá]',
            type: 'GENERAL'
        } as Area;

        const allItems: any[] = [];
        if (template?.groups && template.groups.length > 0) {
            for (const group of template.groups) {
                if (group.items) allItems.push(...group.items);
            }
        } else if (items && items.length > 0) {
            allItems.push(...items);
        }

        const mappedItems = allItems.map((it: any) => {
            const entry = entries.find((e: any) => e.item_id === it.id);
            return {
                id: String(it.id),
                text: it.title || it.content || 'Item',
                isCritical: !!it.is_critical,
                status: mapItemStatus(entry?.value),
                note: entry?.note,
                photoUrl: entry?.photo_url
            };
        });

        let workStatus = run.work_status as WorkStatus;
        if (!workStatus) {
            const rawStatus = String(run.status || '').toLowerCase();
            if (rawStatus === 'open' || rawStatus === 'pending' || rawStatus === 'draft') workStatus = WorkStatus.PENDING;
            else if (rawStatus === 'active' || rawStatus === 'in_progress') workStatus = WorkStatus.IN_PROGRESS;
            else if (rawStatus === 'done' || rawStatus === 'completed') workStatus = WorkStatus.COMPLETED;
            else if (rawStatus === 'needs_review') workStatus = WorkStatus.NEEDS_REVIEW;
            else if (rawStatus === 'approved') workStatus = WorkStatus.APPROVED;
            else if (rawStatus === 'rejected') workStatus = WorkStatus.REJECTED;
            else if (rawStatus === 'reviewed') workStatus = WorkStatus.APPROVED;
            else workStatus = WorkStatus.PENDING;
        }

        let mappedStatus = ChecklistStatus.PENDING;
        if (workStatus === WorkStatus.IN_PROGRESS) mappedStatus = ChecklistStatus.IN_PROGRESS;
        else if (workStatus === WorkStatus.COMPLETED || workStatus === WorkStatus.NEEDS_REVIEW) mappedStatus = ChecklistStatus.COMPLETED;
        else if (workStatus === WorkStatus.APPROVED || workStatus === WorkStatus.REJECTED) mappedStatus = ChecklistStatus.REVIEWED;

        const getIdFromUser = (val: any): string => {
            if (!val) return '';
            if (typeof val === 'number') return String(val);
            if (typeof val === 'object' && val.id) return String(val.id);
            return '';
        };

        return {
            id: String(run.id),
            templateName: template?.name || 'Checklist',
            area,
            shift: 'Ca A',
            date: run.run_date || run.date || new Date().toISOString().split('T')[0],
            status: mappedStatus,
            workStatus: workStatus,
            items: mappedItems,
            assignedTo: getIdFromUser(run.assigned_to),
            verifiedBy: getIdFromUser(run.verified_by) || undefined,
            completedAt: run.completed_at,
            verifiedAt: run.verified_at
        } as Checklist;
    };

    const resolveAreaName = (inc: any, areaList: Area[]): string => {
        if (typeof inc.area === 'string' && inc.area.trim()) {
            return inc.area.trim();
        }
        const areaId = inc.area_id ?? inc.area?.id;
        if (areaId) {
            const found = areaList.find(a => String(a.id) === String(areaId));
            if (found?.name) return found.name;
        }
        return '[Khu vực được xoá]';
    };

    // --- API LOADERS ---
    const loadUsersFromApi = async () => {
        try {
            const apiUsers = await userService.getAll();
            const mapped = (apiUsers || []).map(mapApiUser);
            setUsers(mapped);
        } catch (e) {
            reportError('Failed to load users from API', e, 'Không tải được danh sách nhân sự');
        }
    };

    const loadTemplatesFromApi = async () => {
        try {
            const apiTemplates = await templateService.list();
            setTemplates(apiTemplates || []);
        } catch (e) {
            reportError('Failed to load templates from API', e, 'Không tải được danh sách template');
        }
    };

    const loadAreasFromApi = async (): Promise<Area[]> => {
        try {
            const apiAreas = await areaService.getAll();
            const mapped = (apiAreas || []).map((area: any) => ({
                id: area.id,
                name: area.name,
                type: area.type || 'GENERAL',
                description: area.description || ''
            } as Area));
            setAreas(mapped);
            return mapped;
        } catch (e) {
            reportError('Failed to load areas from API', e, 'Không tải được khu vực');
            return areas;
        }
    };

    const loadIncidentsFromApi = async (areasOverride?: Area[]) => {
        const requestId = `incidents-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setIncidentsFetchId(requestId);
        try {
            const resp = await incidentService.list();
            const apiIncidents: any[] = resp.data || resp || [];
            const areaList = areasOverride || areas;
            const mapped: Incident[] = apiIncidents.map((inc: any) => ({
                id: inc.id,
                title: inc.title,
                description: inc.description || '',
                area: resolveAreaName(inc, areaList),
                priority: (inc.severity || inc.priority || 'medium') as IncidentPriority,
                status: (inc.status || 'open') as any,
                reportedBy: inc.reported_by_name || inc.reported_by || '',
                createdAt: inc.created_at || new Date().toISOString(),
                resolution_note: inc.resolution_note,
                resolved_at: inc.resolved_at,
                resolved_by: inc.resolved_by_name || inc.resolved_by
            } as Incident));
            setIncidents(mapped);
        } catch (e) {
            reportError('Failed to load incidents from API', e, 'Không tải được sự cố');
        } finally {
            setIncidentsFetchId('');
        }
    };

    const loadRunsFromApi = async (areasOverride?: Area[], userOverride?: User) => {
        const requestId = `runs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setRunsFetchId(requestId);
        try {
            const currentUser = userOverride || user;
            const params: any = currentUser && currentUser.role === Role.STAFF
                ? { assigned_to: Number(currentUser.id), per_page: 1000 }
                : { per_page: 1000 };
            const resp = await runService.list(params);
            const apiRuns: any[] = resp.data || resp || [];
            const areaList = areasOverride || areas;
            const mapped = apiRuns.map(run => mapRunToChecklist(run, areaList));
            setChecklists(mapped);
        } catch (e) {
            if (requestId === runsFetchId) {
                console.error('Load runs error:', e);
                reportError('Failed to load runs from API', e, 'Không tải được checklist');
            }
        } finally {
            if (requestId === runsFetchId) setRunsFetchId('');
        }
    };

    // --- STAFF SUMMARY NOTIFICATION ---
    const notifyStaffSummary = async () => {
        try {
            if (!user || user.role !== Role.STAFF) return;
            const todayStr = new Date().toISOString().split('T')[0];
            const storageKey = `daily_summary_${user.id}_${todayStr}`;
            if (seenStaffSummaries.has(storageKey)) return;

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
            seenStaffSummaries.add(storageKey);
        } catch (e) {
            console.warn('Staff summary notification failed:', e);
        }
    };

    // --- EFFECTS ---
    useEffect(() => {
        const loadAppData = async () => {
            if (user) {
                try {
                    if (import.meta.env.DEV) console.log('Loading app data for user:', user.name);
                    await loadAreasFromApi();
                    await Promise.all([loadUsersFromApi(), loadTemplatesFromApi()]);
                    const freshAreas = areas.length > 0 ? areas : [];
                    await Promise.all([loadIncidentsFromApi(freshAreas), loadRunsFromApi(freshAreas, user)]);
                    await notifyStaffSummary();
                } catch (e) {
                    console.error('Failed to load app data:', e);
                }
            }
        };
        if (!isAuthLoading) loadAppData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isAuthLoading]);

    // Polling for supervisor reviews
    useEffect(() => {
        const isSupervisor = user && (user.role === Role.SUPERVISOR || user.role === Role.MANAGER || user.role === Role.ADMIN);
        if (!isSupervisor) {
            setPendingReviewCount(0);
            return;
        }
        const fetchPending = async () => {
            try {
                const resp = await runService.list({ status: 'completed' });
                const runs = (resp as any).data || resp || [];
                setPendingReviewCount(Array.isArray(runs) ? runs.length : 0);
            } catch (e) { }
        };
        fetchPending();
        const id = setInterval(fetchPending, 30000);
        return () => clearInterval(id);
    }, [user]);

    // Polling for incidents
    useEffect(() => {
        const id = setInterval(loadIncidentsFromApi, 60000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        users, setUsers,
        checklists, setChecklists,
        templates, setTemplates,
        incidents, setIncidents,
        areas, setAreas,
        shifts, setShifts,
        pendingReviewCount,
        loadRunsFromApi,
        loadTemplatesFromApi,
        loadAreasFromApi,
        loadIncidentsFromApi,
        mapRunToChecklist,
        notifyStaffSummary,
        reportError,
        mapApiUser,
        runsFetchId, // Exposed in case needed
        incidentsFetchId
    };
};
