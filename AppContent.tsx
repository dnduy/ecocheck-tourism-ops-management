
import React from 'react';
import { Login } from './pages/Login';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { QRScanner } from './components/QRScanner';
import { AppRoutes } from './routes/AppRoutes';
import { useAuth } from './contexts/AuthContext';
import { useNotification } from './contexts/NotificationContext';
import { useUIStore } from './stores/useUIStore';

// Data hooks
import { useIncidents } from './hooks/api/useIncidents';
import { useChecklists } from './hooks/api/useChecklists';
import { useUsers } from './hooks/api/useUsers';
import { useAreas } from './hooks/api/useAreas';
import { useTemplates } from './hooks/api/useTemplates';
import { useShifts } from './hooks/useShifts';
import { useStaffNotifications } from './hooks/useStaffNotifications';

import { Role, User, ChecklistStatus } from './types';
import { Bell, AlertTriangle, X, CheckCircle } from 'lucide-react';

export default function AppContent() {
  // --- UI STATE (from Zustand store) ---
  const {
    currentTab,
    setCurrentTab,
    activeChecklist,
    showScanner,
    setShowScanner,
  } = useUIStore();

  const activeChecklistId = activeChecklist?.id ?? null;

  // --- CONTEXT HOOKS ---
  const { user, isAuthLoading, login, updateUser, logout } = useAuth();
  const { notifications, removeNotification, addNotification } = useNotification();
  const authEnabled = !isAuthLoading && !!user;

  // --- DATA HOOKS (TanStack Query — server state) ---
  const { data: incidents = [] } = useIncidents({ enabled: authEnabled });
  const { data: checklists = [] } = useChecklists(
    (user?.role === Role.STAFF || user?.role === Role.SUPERVISOR)
      ? { assigned_to: Number(user.id) }
      : undefined,
    { enabled: authEnabled }
  );
  const { data: users = [] } = useUsers({ enabled: authEnabled });
  const { data: areas = [] } = useAreas({ enabled: authEnabled });
  const { data: templates = [] } = useTemplates({ enabled: authEnabled });
  const { shifts } = useShifts({ enabled: authEnabled });

  const { notifyStaffSummary } = useStaffNotifications(user);

  // --- LOGIN / LOGOUT ---
  const handleLogin = (userFromLogin: User) => {
    login(userFromLogin);
    setCurrentTab('dashboard');
    setTimeout(() => { notifyStaffSummary(); }, 500);
  };

  const handleLogout = () => {
    logout();
    setCurrentTab('dashboard');
  };

  // --- QR SCANNER ---
  const handleScanSuccess = (decodedText: string) => {
    const foundChecklist = checklists.find(c =>
      String(c.area.id) === String(decodedText) &&
      String(c.assignedTo) === String(user?.id) &&
      c.status === ChecklistStatus.PENDING
    );

    setShowScanner(false);
    if (foundChecklist) {
      addNotification('Tìm thấy', `Đang mở checklist: ${foundChecklist.templateName}`, 'SUCCESS');
    } else {
      const hasArea = areas.some(a => String(a.id) === String(decodedText));
      if (hasArea) {
        addNotification('Khu vực hợp lệ', 'Bạn không có checklist nào cần làm tại đây.', 'NORMAL');
      } else {
        addNotification('Không tìm thấy', 'Mã QR không khớp khu vực nào.', 'CRITICAL');
      }
    }
  };

  // --- LOADING ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">

      {/* Desktop Sidebar */}
      {!activeChecklistId && (
        <div className="hidden md:flex md:w-72 md:flex-col fixed top-0 left-0 bottom-0 z-40 h-screen">
          <Sidebar
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            role={user.role}
            user={user}
            onLogout={handleLogout}
            pendingReviewCount={0}
          />
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${!activeChecklistId ? 'md:ml-72' : ''}`}>
        <div className="flex-1 w-full mx-auto md:p-8">
          <div className="md:max-w-6xl md:mx-auto w-full pb-24 md:pb-0">
            <AppRoutes
              user={user}
              users={users}
              checklists={checklists}
              incidents={incidents}
              areas={areas}
              templates={templates}
              shifts={shifts}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {!activeChecklistId && (
        <div className="md:hidden">
          <Navigation
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            role={user.role}
            pendingReviewCount={0}
          />
        </div>
      )}

      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Push Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-2 w-full max-w-sm md:max-w-md px-4 md:px-0">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto w-full rounded-xl p-4 shadow-xl border flex items-start gap-3 animate-in slide-in-from-right-5 fade-in duration-300 ${
              n.type === 'CRITICAL'
                ? 'bg-red-600 text-white border-red-700'
                : n.type === 'SUCCESS'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white text-gray-800 border-gray-100'
            }`}
          >
            <div className={`p-2 rounded-full shrink-0 ${
              n.type === 'CRITICAL' ? 'bg-white/20' : n.type === 'SUCCESS' ? 'bg-white/20' : 'bg-brand-50 text-brand-600'
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
              <p className="text-[10px] mt-2 opacity-70">Vừa xong</p>
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
