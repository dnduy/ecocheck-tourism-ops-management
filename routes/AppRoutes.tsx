
import React, { Suspense, lazy } from 'react';
import { User, Checklist, Incident, Area, Shift, Role, IncidentPriority, ChecklistStatus } from '../types';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LogOut } from 'lucide-react';

// Lazy load pages
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Checklists = lazy(() => import('../pages/Checklists').then(m => ({ default: m.Checklists })));
const ChecklistExecution = lazy(() => import('../pages/ChecklistExecution').then(m => ({ default: m.ChecklistExecution })));
const Incidents = lazy(() => import('../pages/Incidents').then(m => ({ default: m.Incidents })));
const Reports = lazy(() => import('../pages/Reports').then(m => ({ default: m.Reports })));
const Admin = lazy(() => import('../pages/Admin').then(m => ({ default: m.Admin })));

interface AppRoutesProps {
    currentTab: string;
    user: User;
    users: User[];
    checklists: Checklist[];
    incidents: Incident[];
    areas: Area[];
    templates: any[];
    shifts: Shift[];
    activeChecklist: Checklist | null;
    activeRunContext: { runId: number; columnId: number; sessionId?: number; roleId?: number } | null;
    actions: {
        setCurrentTab: (tab: string) => void;
        setActiveChecklist: (checklist: Checklist | null) => void;
        setActiveRunContext: (ctx: any) => void;
        handleLogout: () => void;
        setShowScanner: (show: boolean) => void;
        loadRunsFromApi: () => Promise<void>;
        loadTemplatesFromApi: () => Promise<void>;
        handleUpdateIncidentStatus: (id: string, s: any, note?: string) => Promise<void>;
        handleCreateIncident: (data: any) => Promise<void>;
        handleAssignIncident: (id: string, userId: number) => Promise<void>;
        handleAddUser: (name: string, email: string, role: Role, password?: string) => Promise<void>;
        handleUpdateUser: (id: string, data: Partial<User>) => Promise<void>;
        handleDeleteUser: (id: string) => Promise<void>;
        handleAddChecklist: (t: string, a: string, s: string, i: any[], at?: string, vb?: string) => Promise<void>;
        handleAssignChecklist: (id: string, updates: any) => Promise<void>;
        handleAddArea: (name: string, type: string) => Promise<void>;
        handleUpdateArea: (id: string, name: string, type: string) => Promise<void>;
        handleDeleteArea: (id: string) => Promise<void>;
        handleAddShift: (name: string, start: string, end: string, type: any, areas: string[]) => Promise<void>;
        handleDeleteShift: (id: string) => Promise<void>;
        handleCloneChecklistsToToday: () => Promise<void>;
        handleCreateTemplate: (data: any) => Promise<void>;
        mapRunToChecklist: (detail: any, areas: Area[]) => Checklist;
        loadAreasFromApi: () => Promise<Area[]>;
        runService: any;
        addNotification: (t: string, m: string, type: any) => void;
    };
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
    currentTab,
    user,
    users,
    checklists,
    incidents,
    areas,
    templates,
    shifts,
    activeChecklist,
    activeRunContext,
    actions
}) => {
    const LoadingFallback = () => (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
    );

    if (activeChecklist) {
        return (
            <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                    <ChecklistExecution
                        checklist={activeChecklist}
                        currentUser={user}
                        runContext={activeRunContext || undefined}
                        onBack={() => {
                            actions.setActiveChecklist(null);
                            actions.setActiveRunContext(null);
                        }}
                        onComplete={async (updated) => {
                            try {
                                if (activeRunContext) {
                                    await actions.loadRunsFromApi();
                                }
                                actions.setActiveChecklist(null);
                                actions.setActiveRunContext(null);
                                if (updated.status === ChecklistStatus.COMPLETED) {
                                    actions.addNotification('Hoàn thành', 'Đã gửi báo cáo checklist', 'SUCCESS');
                                } else if (updated.status === ChecklistStatus.REVIEWED) {
                                    actions.addNotification('Đã duyệt', 'Checklist đã được phê duyệt', 'SUCCESS');
                                }
                            } catch (e: any) {
                                console.error('Update run status failed:', e);
                                actions.addNotification('Lỗi', e.message || 'Không cập nhật được checklist', 'CRITICAL');
                            }
                        }}
                        onCreateIncident={async (t, d, a) => {
                            await actions.handleCreateIncident({
                                title: t,
                                description: d,
                                area: a,
                                priority: IncidentPriority.MEDIUM,
                                reportedBy: user.name
                            });
                        }}
                    />
                </Suspense>
            </ErrorBoundary>
        );
    }

    switch (currentTab) {
        case 'dashboard':
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <Dashboard
                            user={user}
                            users={users}
                            checklists={checklists}
                            incidents={incidents}
                            onChangeTab={actions.setCurrentTab}
                            onLogout={actions.handleLogout}
                            onOpenScanner={() => actions.setShowScanner(true)}
                        />
                    </Suspense>
                </ErrorBoundary>
            );
        case 'checklists':
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <Checklists
                            checklists={checklists}
                            currentUser={user}
                            users={users}
                            onRefresh={actions.loadRunsFromApi}
                            onSelectChecklist={async (id) => {
                                try {
                                    const runId = Number(id);
                                    const detail = await actions.runService.get(runId);

                                    const areaList = areas.length ? areas : await actions.loadAreasFromApi();
                                    const mapped = actions.mapRunToChecklist(detail, areaList);

                                    const columns = (detail as any).columns || detail.template?.columns || [];
                                    const roles = (detail as any).roles || detail.template?.roles || [];
                                    const lowerRole = (user.role || '').toLowerCase();
                                    const runSessionId =
                                        (detail as any).session_id ||
                                        (detail as any).run?.session_id ||
                                        (detail as any).session?.id;

                                    const sessionColumns = runSessionId
                                        ? columns.filter((c: any) => String(c.session_id) === String(runSessionId))
                                        : columns;

                                    const matchedColumn =
                                        sessionColumns.find((c: any) => {
                                            const colRoleName = (c.role_name || c.role?.name || '').toLowerCase();
                                            if (colRoleName && colRoleName === lowerRole) return true;
                                            const colRoleId = c.role_id || c.role?.id;
                                            if (!colRoleId) return false;
                                            const colRole = roles.find((r: any) => String(r.id) === String(colRoleId));
                                            return colRole ? (colRole.name || '').toLowerCase() === lowerRole : false;
                                        }) ||
                                        sessionColumns[0] ||
                                        columns[0];

                                    if (!matchedColumn?.id) {
                                        actions.addNotification('Lỗi', 'Checklist chưa có cột đánh giá hợp lệ', 'CRITICAL');
                                        return;
                                    }

                                    const columnId = matchedColumn.id;
                                    const sessionId =
                                        matchedColumn?.session_id ||
                                        runSessionId ||
                                        (detail as any).sessions?.[0]?.id ||
                                        detail.template?.sessions?.[0]?.id;
                                    const roleId =
                                        matchedColumn?.role_id ||
                                        matchedColumn?.role?.id ||
                                        roles.find((r: any) => (r.name || '').toLowerCase() === lowerRole)?.id;

                                    actions.setActiveChecklist(mapped);
                                    actions.setActiveRunContext({ runId, columnId, sessionId, roleId });
                                } catch (e) {
                                    console.error('Load run detail failed:', e);
                                    actions.addNotification('Lỗi', 'Không tải được checklist', 'CRITICAL');
                                }
                            }}
                        />
                    </Suspense>
                </ErrorBoundary>
            );
        case 'incidents':
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <Incidents
                            incidents={incidents}
                            currentUser={user}
                            users={users}
                            areas={areas}
                            onUpdateStatus={actions.handleUpdateIncidentStatus}
                            onCreateIncident={actions.handleCreateIncident}
                            onAssignIncident={actions.handleAssignIncident}
                        />
                    </Suspense>
                </ErrorBoundary>
            );
        case 'reports':
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <Reports checklists={checklists} incidents={incidents} users={users} />
                    </Suspense>
                </ErrorBoundary>
            );
        case 'admin':
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <Admin
                            currentUser={user}
                            users={users}
                            checklists={checklists}
                            areas={areas}
                            templates={templates}
                            shifts={shifts}
                            onAddUser={actions.handleAddUser}
                            onUpdateUser={actions.handleUpdateUser}
                            onDeleteUser={actions.handleDeleteUser}
                            onAddChecklist={actions.handleAddChecklist}
                            onAssignChecklist={actions.handleAssignChecklist}
                            onAddArea={actions.handleAddArea}
                            onUpdateArea={actions.handleUpdateArea}
                            onDeleteArea={actions.handleDeleteArea}
                            onAddShift={actions.handleAddShift}
                            onDeleteShift={actions.handleDeleteShift}
                            onCloneDaily={actions.handleCloneChecklistsToToday}
                            onCreateTemplate={actions.handleCreateTemplate}
                            onRunsChanged={actions.loadRunsFromApi}
                            onTemplatesChanged={actions.loadTemplatesFromApi}
                        />
                    </Suspense>
                </ErrorBoundary>
            );
        case 'settings':
            return (
                <div className="p-4 space-y-6">
                    <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center space-x-4 pb-6 border-b border-gray-50">
                            <img src={user.avatar} className="w-16 h-16 rounded-full border-4 border-brand-100" alt="Profile" />
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
                                <p className="text-xs text-gray-500 mb-2">{user.email}</p>
                                <span className="text-[10px] bg-brand-600 text-white px-2 py-1 rounded-full font-bold uppercase tracking-wider">{user.role}</span>
                            </div>
                        </div>
                        <button onClick={actions.handleLogout} className="w-full flex items-center justify-center gap-3 p-4 text-red-600 font-bold hover:bg-red-50 rounded-2xl transition-colors">
                            <LogOut size={20} />
                            Đăng xuất
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-400">EcoCheck Ops v3.7.0</p>
                </div>
            );
        default:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingFallback />}>
                        <Dashboard
                            user={user}
                            users={users}
                            checklists={checklists}
                            incidents={incidents}
                            onChangeTab={actions.setCurrentTab}
                            onLogout={actions.handleLogout}
                            onOpenScanner={() => actions.setShowScanner(true)}
                        />
                    </Suspense>
                </ErrorBoundary>
            );
    }
};
