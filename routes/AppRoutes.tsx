
import React, { Suspense, lazy } from 'react';
import { User, Checklist, Incident, Area, Shift, Role, IncidentPriority, ChecklistStatus } from '../types';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LogOut } from 'lucide-react';
import { useUIStore } from '../stores/useUIStore';
import { useNotification } from '../contexts/NotificationContext';
import { runService } from '../services/runService';
import { mapRunToChecklist } from '../services/mappers';
import { useAreas } from '../hooks/api/useAreas';
import { useQueryClient } from '@tanstack/react-query';

// Lazy load pages
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Checklists = lazy(() => import('../pages/Checklists').then(m => ({ default: m.Checklists })));
const ChecklistExecution = lazy(() => import('../pages/ChecklistExecution').then(m => ({ default: m.ChecklistExecution })));
const Incidents = lazy(() => import('../pages/Incidents').then(m => ({ default: m.Incidents })));
const Reports = lazy(() => import('../pages/Reports').then(m => ({ default: m.Reports })));
const Admin = lazy(() => import('../pages/Admin').then(m => ({ default: m.Admin })));

interface AppRoutesProps {
    user: User;
    users: User[];
    checklists: Checklist[];
    incidents: Incident[];
    areas: Area[];
    templates: any[];
    shifts: Shift[];
    onLogout: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
    user,
    users,
    checklists,
    incidents,
    areas,
    templates,
    shifts,
    onLogout,
}) => {
    const {
        currentTab,
        activeChecklist,
        activeRunContext,
        setActiveChecklist,
        setActiveRunContext,
        clearActiveRun,
        setShowScanner,
    } = useUIStore();
    const { addNotification } = useNotification();
    const queryClient = useQueryClient();
    const { refetch: refetchAreas } = useAreas({ enabled: false });

    const LoadingFallback = () => (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
    );

    const handleSelectChecklist = async (id: string) => {
        try {
            const runId = Number(id);
            const detail = await runService.get(runId);

            let areaList = areas.length ? areas : [];
            if (!areaList.length) {
                const res = await refetchAreas();
                areaList = res.data || [];
            }
            const mapped = mapRunToChecklist(detail, areaList);

            const columns = detail.columns || detail.template?.columns || [];
            const roles = detail.roles || [];
            const lowerRole = (user.role || '').toLowerCase();
            const runSessionId =
                detail.run?.session_id ||
                (detail as any).session_id ||
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
                addNotification('Lỗi', 'Checklist chưa có cột đánh giá hợp lệ', 'CRITICAL');
                return;
            }

            const columnId = matchedColumn.id;
            const sessionId =
                matchedColumn?.session_id ||
                runSessionId ||
                detail.sessions?.[0]?.id;
            const roleId =
                matchedColumn?.role_id ||
                (matchedColumn as any)?.role?.id ||
                roles.find((r: any) => (r.name || '').toLowerCase() === lowerRole)?.id;

            setActiveChecklist(mapped);
            setActiveRunContext({ runId, columnId, sessionId, roleId });
        } catch (e) {
            console.error('Load run detail failed:', e);
            addNotification('Lỗi', 'Không tải được checklist', 'CRITICAL');
        }
    };

    if (activeChecklist) {
        return (
            <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                    <ChecklistExecution
                        checklist={activeChecklist}
                        currentUser={user}
                        runContext={activeRunContext || undefined}
                        onBack={() => clearActiveRun()}
                        onComplete={async (updated) => {
                            try {
                                if (activeRunContext) {
                                    queryClient.invalidateQueries({ queryKey: ['checklists'] });
                                }
                                clearActiveRun();
                                if (updated.status === ChecklistStatus.COMPLETED) {
                                    addNotification('Hoàn thành', 'Đã gửi báo cáo checklist', 'SUCCESS');
                                } else if (updated.status === ChecklistStatus.REVIEWED) {
                                    addNotification('Đã duyệt', 'Checklist đã được phê duyệt', 'SUCCESS');
                                }
                            } catch (e: any) {
                                console.error('Update run status failed:', e);
                                addNotification('Lỗi', e.message || 'Không cập nhật được checklist', 'CRITICAL');
                            }
                        }}
                        onCreateIncident={async (t, d, a) => {
                            // Incidents page manages its own mutations; this is a side-effect create
                            console.warn('onCreateIncident from ChecklistExecution — consider moving to useIncidentMutations', { t, d, a });
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
                            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['checklists'] })}
                            onSelectChecklist={handleSelectChecklist}
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
                        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 text-red-600 font-bold hover:bg-red-50 rounded-2xl transition-colors">
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
                        />
                    </Suspense>
                </ErrorBoundary>
            );
    }
};
