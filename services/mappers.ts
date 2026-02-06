
import { User, Checklist, Incident, Area, ChecklistStatus, WorkStatus, IncidentPriority, ChecklistItem } from '../types';

export const mapApiUser = (u: any): User => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff`
});

export const mapItemStatus = (value?: string): ChecklistItem['status'] => {
    if (value === 'ok') return 'PASS';
    if (value === 'not_ok') return 'FAIL';
    return undefined;
};

export const getIdFromUser = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object' && val.id) return String(val.id);
    return '';
};

export const mapRunToChecklist = (runData: any, areaList: Area[]): Checklist => {
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
        if (rawStatus === 'open' || rawStatus === 'pending' || rawStatus === 'draft') {
            workStatus = WorkStatus.PENDING;
        } else if (rawStatus === 'active' || rawStatus === 'in_progress') {
            workStatus = WorkStatus.IN_PROGRESS;
        } else if (rawStatus === 'done' || rawStatus === 'completed') {
            workStatus = WorkStatus.COMPLETED;
        } else if (rawStatus === 'needs_review') {
            workStatus = WorkStatus.NEEDS_REVIEW;
        } else if (rawStatus === 'approved') {
            workStatus = WorkStatus.APPROVED;
        } else if (rawStatus === 'rejected') {
            workStatus = WorkStatus.REJECTED;
        } else if (rawStatus === 'reviewed') {
            workStatus = WorkStatus.APPROVED;
        } else {
            workStatus = WorkStatus.PENDING;
        }
    }

    let mappedStatus = ChecklistStatus.PENDING;
    // Map from workStatus (source of truth) to ChecklistStatus (UI)
    if (workStatus === WorkStatus.IN_PROGRESS) mappedStatus = ChecklistStatus.IN_PROGRESS;
    else if (workStatus === WorkStatus.COMPLETED || workStatus === WorkStatus.NEEDS_REVIEW) mappedStatus = ChecklistStatus.COMPLETED;
    else if (workStatus === WorkStatus.APPROVED || workStatus === WorkStatus.REJECTED) mappedStatus = ChecklistStatus.REVIEWED;
    // Fallback or legacy status check only if workStatus didn't catch it (optional)
    else if (String(run.status || '').toLowerCase() === 'reviewed') mappedStatus = ChecklistStatus.REVIEWED;

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

export const resolveAreaName = (inc: any, areaList: Area[]): string => {
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
