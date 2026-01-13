import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Checklists } from './pages/Checklists';
import { ChecklistExecution } from './pages/ChecklistExecution';
import { Incidents } from './pages/Incidents';
import { Reports } from './pages/Reports';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { QRScanner } from './components/QRScanner';
import { Role, Incident, User, Area } from './types';
import { Bell, AlertTriangle, X, CheckCircle, Loader } from 'lucide-react';
import { authService } from './services/authService';
import { areaService } from './services/areaService';
import { incidentService } from './services/incidentService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'CRITICAL' | 'NORMAL' | 'SUCCESS';
  timestamp: number;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // QR Scanner State
  const [showScanner, setShowScanner] = useState(false);

  // Application Data State
  const [areas, setAreas] = useState<Area[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // --- INITIALIZATION ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if user is already logged in
        const token = authService.getToken();
        const savedUser = authService.getCurrentUser();

        if (token && savedUser) {
          setUser(savedUser);
          await loadAppData();
        }
      } catch (error) {
        console.error('Init error:', error);
        authService.logout();
      } finally {
        setIsAuthLoading(false);
      }
    };

    initApp();
  }, []);

  const loadAppData = async () => {
    try {
      setDataLoading(true);
      const [areasData, incidentsData] = await Promise.all([
        areaService.getAll(),
        incidentService.list()
      ]);
      setAreas(areasData);
      setIncidents(incidentsData.data || []);
    } catch (error: any) {
      console.error('Error loading app data:', error);
      addNotification('Lỗi', error.message, 'CRITICAL');
    } finally {
      setDataLoading(false);
    }
  };

  // --- NOTIFICATIONS ---
  const addNotification = (title: string, message: string, type: 'CRITICAL' | 'NORMAL' | 'SUCCESS' = 'NORMAL') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, message, type, timestamp: Date.now() }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- HANDLERS ---

  const handleLogin = async (loginUser: User) => {
    setUser(loginUser);
    await loadAppData();
    addNotification('Đăng nhập', `Chào ${loginUser.name}!`, 'SUCCESS');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setAreas([]);
      setIncidents([]);
      setCurrentTab('dashboard');
      addNotification('Đăng xuất', 'Bạn đã đăng xuất thành công', 'NORMAL');
    } catch (error: any) {
      addNotification('Lỗi', error.message, 'CRITICAL');
    }
  };

  // --- AREA HANDLERS ---
  const handleAddArea = async (name: string, type: string) => {
    try {
      const newArea = await areaService.create({ name, type });
      setAreas(prev => [...prev, newArea]);
      addNotification('Khu vực', `Đã thêm khu vực: ${name}`, 'SUCCESS');
    } catch (error: any) {
      addNotification('Lỗi', error.message, 'CRITICAL');
    }
  };

  const handleUpdateArea = async (id: number, updates: Partial<Area>) => {
    try {
      const updated = await areaService.update(id, updates);
      setAreas(prev => prev.map(a => a.id === id ? updated : a));
      addNotification('Cập nhật', 'Khu vực đã được cập nhật', 'SUCCESS');
    } catch (error: any) {
      addNotification('Lỗi', error.message, 'CRITICAL');
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (!window.confirm('Xác nhận xóa khu vực này?')) return;
    try {
      await areaService.delete(id);
      setAreas(prev => prev.filter(a => a.id !== id));
      addNotification('Đã xóa', 'Khu vực đã bị xóa', 'NORMAL');
    } catch (error: any) {
      addNotification('Lỗi', error.message, 'CRITICAL');
    }
  };

  // --- INCIDENT HANDLERS ---
  const handleCreateIncident = async (areaId: number, title: string, description: string, severity: string = 'medium') => {
    try {
      const newIncident = await incidentService.create({
        area_id: areaId,
        title,
        description,
        severity
      });
      setIncidents(prev => [...prev, newIncident]);
      addNotification('Sự cố', 'Đã báo cáo sự cố mới', 'NORMAL');
    } catch (error: any) {
      addNotification('Lỗi', error.message, 'CRITICAL');
    }
  };

  const handleUpdateIncident = async (id: number, status: string, resolutionNote?: string) => {
    try {
      const updated = await incidentService.update(id, { status, resolution_note: resolutionNote });
      setIncidents(prev => prev.map(i => i.id === id ? updated : i));
      addNotification('Cập nhật', 'Sự cố đã được cập nhật', 'SUCCESS');
    } catch (error: any) {
      addNotification('Lỗi', error.message, 'CRITICAL');
    }
  };

  // --- LOADING & AUTH SCREENS ---
  if (isAuthLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader size={48} className="mx-auto animate-spin text-brand-600" />
          <p className="text-gray-600 font-medium">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // --- MAIN APP ---
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg backdrop-blur-md pointer-events-auto animate-in slide-in-from-top-2 ${
              notif.type === 'CRITICAL' ? 'bg-red-50 border border-red-200' :
              notif.type === 'SUCCESS' ? 'bg-green-50 border border-green-200' :
              'bg-blue-50 border border-blue-200'
            }`}
          >
            {notif.type === 'CRITICAL' && <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />}
            {notif.type === 'SUCCESS' && <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />}
            {notif.type === 'NORMAL' && <Bell size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className={`text-sm font-bold ${
                notif.type === 'CRITICAL' ? 'text-red-900' :
                notif.type === 'SUCCESS' ? 'text-green-900' :
                'text-blue-900'
              }`}>{notif.title}</p>
              <p className={`text-xs ${
                notif.type === 'CRITICAL' ? 'text-red-700' :
                notif.type === 'SUCCESS' ? 'text-green-700' :
                'text-blue-700'
              }`}>{notif.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="flex-shrink-0 mt-0.5"
            >
              <X size={14} className={
                notif.type === 'CRITICAL' ? 'text-red-400' :
                notif.type === 'SUCCESS' ? 'text-green-400' :
                'text-blue-400'
              } />
            </button>
          </div>
        ))}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScanSuccess={(decodedText) => {
            setActiveChecklistId(decodedText);
            setShowScanner(false);
            setCurrentTab('execution');
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation */}
        <Navigation
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          onOpenScanner={() => setShowScanner(true)}
          userRole={user.role}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {dataLoading && currentTab !== 'dashboard' && (
            <div className="flex items-center justify-center h-full">
              <Loader size={32} className="animate-spin text-brand-600" />
            </div>
          )}

          {currentTab === 'dashboard' && (
            <Dashboard
              user={user}
              areas={areas}
              incidents={incidents}
              onChangeTab={setCurrentTab}
              onLogout={handleLogout}
              onOpenScanner={() => setShowScanner(true)}
            />
          )}

          {currentTab === 'checklists' && (
            <Checklists
              areas={areas}
              user={user}
              onSelectChecklist={setActiveChecklistId}
              onChangeTab={setCurrentTab}
            />
          )}

          {currentTab === 'execution' && activeChecklistId && (
            <ChecklistExecution
              checklistId={activeChecklistId}
              user={user}
              onBack={() => {
                setActiveChecklistId(null);
                setCurrentTab('checklists');
              }}
              onCompleted={() => {
                addNotification('Hoàn thành', 'Checklist đã được ghi lại', 'SUCCESS');
                setActiveChecklistId(null);
                setCurrentTab('checklists');
              }}
              onCreateIncident={(areaId, title, desc, severity) =>
                handleCreateIncident(areaId, title, desc, severity)
              }
              addNotification={addNotification}
            />
          )}

          {currentTab === 'incidents' && (
            <Incidents
              incidents={incidents}
              areas={areas}
              currentUser={user}
              onUpdateStatus={(id, status) => {
                const inc = incidents.find(i => i.id === id);
                if (inc) handleUpdateIncident(id, status);
              }}
              onCreateIncident={(data: any) => 
                handleCreateIncident(data.area_id, data.title, data.description, data.severity)
              }
              addNotification={addNotification}
            />
          )}

          {currentTab === 'reports' && (
            <Reports
              areas={areas}
              incidents={incidents}
            />
          )}

          {currentTab === 'admin' && user.role === Role.MANAGER && (
            <Admin
              currentUser={user}
              areas={areas}
              onAddArea={handleAddArea}
              onUpdateArea={handleUpdateArea}
              onDeleteArea={handleDeleteArea}
              addNotification={addNotification}
            />
          )}
        </div>
      </div>
    </div>
  );
}
