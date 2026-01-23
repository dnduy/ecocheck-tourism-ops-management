
import React, { useState } from 'react';
import { Login } from './pages/Login';
import { Navigation } from './components/Navigation';
import { QRScanner } from './components/QRScanner';
import { AppRoutes } from './routes/AppRoutes';
import { useAuth } from './contexts/AuthContext';
import { useNotification } from './contexts/NotificationContext';

// Hooks
import { useIncidents, useIncidentMutations } from './hooks/api/useIncidents';
import { useChecklists, useChecklistMutations } from './hooks/api/useChecklists';
import { useUsers, useUserMutations } from './hooks/api/useUsers';
import { useAreas, useAreaMutations } from './hooks/api/useAreas';
import { useTemplates, useTemplateMutations } from './hooks/api/useTemplates';
import { useShifts } from './hooks/useShifts';
import { useStaffNotifications } from './hooks/useStaffNotifications';

import { Role, Checklist, IncidentPriority, User } from './types';
import { Link, Bell, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { runService } from './services/runService';
import { mapRunToChecklist } from './services/mappers';
import { ChecklistStatus } from './types';

export default function AppContent() {
  // --- UI STATE ---
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState<Checklist | null>(null);
  const [activeRunContext, setActiveRunContext] = useState<{ runId: number; columnId: number; sessionId?: number; roleId?: number } | null>(null);

  // --- CONTEXT HOOKS ---
  const { user, isAuthLoading, login, updateUser, logout } = useAuth();
  const { notifications, removeNotification, addNotification } = useNotification();

  // --- DATA HOOKS (TanStack Query) ---
  const { data: incidents = [], refetch: refetchIncidents } = useIncidents();
  // Filter runs for staff automatically if needed, simplified here to fetch all (cached)
  // Optimization: pass currentUser to useChecklists to filter at query level if backend supports it
  const { data: checklists = [], refetch: refetchChecklists } = useChecklists(
    user?.role === Role.STAFF ? { assigned_to: Number(user.id) } : undefined
  );
  const { data: users = [] } = useUsers();
  const { data: areas = [], refetch: refetchAreas } = useAreas();
  const { data: templates = [], refetch: refetchTemplates } = useTemplates();
  const { shifts, addShift, deleteShift } = useShifts();

  // --- MUTATIONS ---
  const { createIncident, updateIncident, assignIncident } = useIncidentMutations();
  const { createChecklist, assignChecklist } = useChecklistMutations();
  const { createUser, updateUser: updateUserApi, deleteUser } = useUserMutations();
  const { createArea, updateArea, deleteArea } = useAreaMutations();
  const { createTemplate } = useTemplateMutations();

  // --- HELPERS ---
  const { notifyStaffSummary } = useStaffNotifications(user);

  // --- HANDLERS ---
  const handleLogin = (userFromLogin: User) => {
    login(userFromLogin);
    setCurrentTab('dashboard');
    setTimeout(() => { notifyStaffSummary(); }, 500);
  };

  const handleLogout = () => {
    logout();
    setCurrentTab('dashboard');
  };

  const actions = {
    setCurrentTab,
    setActiveChecklist,
    setActiveRunContext,
    handleLogout,
    setShowScanner,
    // Adapters for AppRoutes which expects Promise<void>
    loadRunsFromApi: async () => { await refetchChecklists(); },
    loadTemplatesFromApi: async () => { await refetchTemplates(); },
    loadAreasFromApi: async () => {
      const res = await refetchAreas();
      return res.data || [];
    },
    mapRunToChecklist,
    runService, // Keeps raw service for detailed fetching in onSelectChecklist
    addNotification,

    handleCreateIncident: async (data: any) => {
      // Map priority to severity
      const severity = (data.priority === 'CRITICAL' ? 'high' : data.priority.toLowerCase());

      await createIncident.mutateAsync({
        ...data,
        // Ensure area_id is a number, handling both ID strings and names if necessary
        area_id: isNaN(Number(data.area))
          ? areas.find(a => a.name === data.area)?.id || 0
          : Number(data.area),
        severity
      });
    },

    handleUpdateIncidentStatus: async (id: string, s: any, resolutionNote?: string) => {
      await updateIncident.mutateAsync({ id, data: { status: s, resolution_note: resolutionNote } });
    },

    handleAssignIncident: async (id: string, userId: number) => {
      await assignIncident.mutateAsync({ id, userId });
    },

    handleAddUser: async (name: string, email: string, role: Role, password?: string) => {
      await createUser.mutateAsync({ name, email, role, password });
    },

    handleUpdateUser: async (id: string, data: Partial<User>) => {
      await updateUserApi.mutateAsync({ id, data });
      // Update local auth user if it's self
      if (String(id) === String(user?.id)) {
        // Fetch updated user to update context?
        // Query cache updates list, but context needs explicit update
        // We can just merge updates:
        updateUser({ ...user!, ...data });
      }
    },

    handleDeleteUser: async (id: string) => {
      await deleteUser.mutateAsync(id);
    },

    handleAddChecklist: async (t: string, a: string, s: string, i: any[], at?: string, vb?: string) => {
      const run = await createChecklist.mutateAsync({ areaId: Number(a), date: new Date().toISOString().split('T')[0] });
      if (at || vb) {
        // `run` is returned from mutationFn (api response)
        // Need to update assignment
        const runId = (run as any).id || (run as any).run?.id;
        await assignChecklist.mutateAsync({ id: runId, data: { assigned_to: Number(at), verified_by: Number(vb) } });
      }
    },

    handleAssignChecklist: async (id: string, updates: any) => {
      await assignChecklist.mutateAsync({ id: Number(id), data: { assigned_to: updates.assignedTo, verified_by: updates.verifiedBy } });
    },

    handleAddArea: async (name: string, type: string) => {
      await createArea.mutateAsync({ name, type });
    },

    handleUpdateArea: async (id: string, name: string, type: string) => {
      await updateArea.mutateAsync({ id: Number(id), data: { name, type } });
    },

    handleDeleteArea: async (id: string) => {
      await deleteArea.mutateAsync(Number(id));
    },

    handleAddShift: async (name: string, start: string, end: string, type: any, areas: string[]) => {
      await addShift(name, start, end, type, areas);
    },

    handleDeleteShift: async (id: string) => {
      await deleteShift(id);
    },

    handleCloneChecklistsToToday: async () => {
      await refetchChecklists();
      addNotification('Đã làm mới', 'Đã cập nhật danh sách', 'SUCCESS');
    },

    handleCreateTemplate: async (data: any) => {
      const payload = {
        area_id: Number(data.areaId),
        name: data.name,
        description: data.description,
        version: 'v1',
        is_active: true,
        groups: [{ title: data.groupTitle, items: data.itemTitles.map((t: string) => ({ title: t })) }],
        columns: [{ label: data.columnLabel || 'Ca A', type: 'text' }]
      };
      await createTemplate.mutateAsync(payload);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    const foundChecklist = checklists.find(c =>
      c.area.id === decodedText &&
      c.assignedTo === user?.id &&
      c.status === ChecklistStatus.PENDING
    );

    if (foundChecklist) {
      setShowScanner(false);
      setActiveChecklistId(foundChecklist.id);
      addNotification('Tìm thấy', `Đang mở checklist: ${foundChecklist.templateName}`, 'SUCCESS');
    } else {
      setShowScanner(false);
      const hasArea = areas.some(a => a.id === decodedText);
      if (hasArea) {
        addNotification('Khu vực hợp lệ', 'Bạn không có checklist nào cần làm tại đây.', 'NORMAL');
      } else {
        addNotification('Không tìm thấy', `Mã QR không khớp khu vực nào.`, 'CRITICAL');
      }
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl overflow-hidden relative">
      <div className="pb-20">
        <AppRoutes
          currentTab={currentTab}
          user={user}
          users={users}
          checklists={checklists}
          incidents={incidents}
          areas={areas}
          templates={templates}
          shifts={shifts}
          activeChecklist={activeChecklist}
          activeRunContext={activeRunContext}
          actions={actions}
        />
      </div>

      {!activeChecklistId && (
        <Navigation
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          role={user.role}
          // Use pendingReviewCount if we want to add polling for it, currently dropped in simplification or use query
          pendingReviewCount={0}
        />
      )}

      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Push Notification Container */}
      <div className="fixed top-0 left-0 right-0 p-4 z-[9999] pointer-events-none flex flex-col items-center gap-2 max-w-md mx-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto w-full max-w-sm rounded-2xl p-4 shadow-2xl border flex items-start gap-3 animate-in slide-in-from-top-5 fade-in duration-300 ${n.type === 'CRITICAL'
              ? 'bg-red-600 text-white border-red-700'
              : n.type === 'SUCCESS'
                ? 'bg-green-600 text-white border-green-700'
                : 'bg-white text-gray-800 border-gray-100'
              }`}
          >
            <div className={`p-2 rounded-full shrink-0 ${n.type === 'CRITICAL' ? 'bg-white/20' : n.type === 'SUCCESS' ? 'bg-white/20' : 'bg-brand-50 text-brand-600'
              }`}>
              {n.type === 'CRITICAL' ? <AlertTriangle size={20} /> : n.type === 'SUCCESS' ? <CheckCircle size={20} /> : <Bell size={20} />}
            </div>
            <div className="flex-1 pt-0.5">
              <h4 className={`text-sm font-bold leading-tight ${n.type === 'NORMAL' ? 'text-gray-900' : 'text-white'}`}>
                {n.title}
              </h4>
              <p className={`text-xs mt-1 leading-snug ${n.type === 'NORMAL' ? 'text-gray-500' : 'text-white/90'}`}>
                {n.message}
              </p>
              <p className={`text-[10px] mt-2 opacity-70`}>Vừa xong</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className={`p-1 rounded-lg hover:bg-black/10 transition-colors ${n.type === 'NORMAL' ? 'text-gray-400' : 'text-white/70'}`}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
