
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navigation } from './components/Navigation';
import { Login } from './pages/Login';
import { QRScanner } from './components/QRScanner';

// Lazy load heavy pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Checklists = lazy(() => import('./pages/Checklists').then(m => ({ default: m.Checklists })));
const ChecklistExecution = lazy(() => import('./pages/ChecklistExecution').then(m => ({ default: m.ChecklistExecution })));
const Incidents = lazy(() => import('./pages/Incidents').then(m => ({ default: m.Incidents })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
import { Role, Checklist, ChecklistStatus, WorkStatus, Incident, IncidentStatus, IncidentPriority, User, Area, Shift } from './types';
import { LogOut, Bell, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { db } from './services/database'; // Import Database Service
import { incidentService } from './services/incidentService';
import { areaService } from './services/areaService';
import { runService } from './services/runService';
import { userService } from './services/userService';
import { templateService } from './services/templateService';
import { getErrorMessage } from './services/errorUtils';
import { sanitizeInput, sanitizeEmail, isValidEmail, validatePasswordStrength } from './services/validation';

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
  const [users, setUsers] = useState<User[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [activeChecklist, setActiveChecklist] = useState<Checklist | null>(null);
  const [activeRunContext, setActiveRunContext] = useState<{ runId: number; columnId: number; sessionId?: number; roleId?: number } | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isFetchingRuns, setIsFetchingRuns] = useState(false);
  const [isFetchingIncidents, setIsFetchingIncidents] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  // --- NOTIFICATIONS ---
  const addNotification = (title: string, message: string, type: 'CRITICAL' | 'NORMAL' | 'SUCCESS' = 'NORMAL') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, { id, title, message, type, timestamp: Date.now() }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const reportError = (label: string, err: unknown, fallback: string) => {
    console.error(label, err);
    addNotification('Lỗi', getErrorMessage(err, fallback), 'CRITICAL');
  };

  const canAccessAdmin = user?.role === Role.MANAGER || user?.role === Role.SUPERVISOR;

  // --- INITIALIZATION ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check for API-based session first
        const apiToken = localStorage.getItem('api_token');
        const currentUser = localStorage.getItem('current_user');
        
        if (apiToken && currentUser) {
          try {
            const parsedUser = JSON.parse(currentUser);
            if (import.meta.env.DEV) console.log('Found API session, setting user:', parsedUser);
            setUser(parsedUser);
          } catch (e) {
            console.error('Failed to parse current_user:', e);
          }
        } else {
          // Fallback to old DB session
          db.init();
          const sessionUser = db.getSession();
          if (sessionUser) {
            if (import.meta.env.DEV) console.log('Found DB session, setting user:', sessionUser);
            setUser(sessionUser);
          }
        }

        // Only load data if we have a user
        if (apiToken) {
          try {
            await refreshData();
            // Override with live API data
            const usersPromise = loadUsersFromApi();
            const templatesPromise = loadTemplatesFromApi();
            const freshAreas = await loadAreasFromApi();
            await Promise.all([
              usersPromise,
              templatesPromise,
              loadIncidentsFromApi(freshAreas),
              loadRunsFromApi(freshAreas)
            ]);

            // Daily task notification for staff
            await notifyStaffSummary();
          } catch (e) {
            console.error('Failed to load app data:', e);
            // Data load errors don't block login screen
          }
        }
      } catch (e) {
        console.error('Init app error:', e);
      } finally {
        setIsAuthLoading(false);
      }
    };
    initApp();
  }, []);

  const refreshData = async () => {
    const [u, c, i, a, s] = await Promise.all([
      db.getUsers(),
      db.getChecklists(),
      db.getIncidents(),
      db.getAreas(),
      db.getShifts()
    ]);
    setUsers(u);
    setChecklists(c);
    setIncidents(i);
    setAreas(a);
    setShifts(s);
  };

  // --- USERS VIA API ---
  const mapApiUser = (u: any): User => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff`
  });

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

  // --- AREAS VIA API ---
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

  // --- INCIDENTS VIA API ---
  const loadIncidentsFromApi = async (areasOverride?: Area[]) => {
    if (isFetchingIncidents) return;
    setIsFetchingIncidents(true);
    try {
      const resp = await incidentService.list();
      const apiIncidents: any[] = resp.data || resp || [];
      const areaList = areasOverride || areas;
      const mapped: Incident[] = apiIncidents.map((inc: any) => {
        // Try to resolve area name from current areas state if available
        let areaName = '';
        const areaId = inc.area_id ?? inc.area?.id;
        if (typeof inc.area === 'string') {
          areaName = inc.area;
        } else if (typeof areaId !== 'undefined') {
          const found = areaList.find(a => String(a.id) === String(areaId));
          areaName = found?.name || `Khu vực #${areaId}`;
        }
        return {
          id: inc.id,
          title: inc.title,
          description: inc.description || '',
          area: areaName,
          priority: (inc.severity || inc.priority || 'medium') as IncidentPriority,
          status: (inc.status || 'open') as any,
          reportedBy: inc.reported_by_name || inc.reported_by || '',
          createdAt: inc.created_at || new Date().toISOString(),
          resolution_note: inc.resolution_note,
          resolved_at: inc.resolved_at,
          resolved_by: inc.resolved_by_name || inc.resolved_by
        } as unknown as Incident;
      });
      setIncidents(mapped);
    } catch (e) {
      reportError('Failed to load incidents from API', e, 'Không tải được sự cố');
    } finally {
      setIsFetchingIncidents(false);
    }
  };

  // --- RUNS VIA API ---
  const mapRunToChecklist = (runData: any, areaList: Area[]): Checklist => {
    // runData structure from API:
    // { id, area_id, status, template: {id, name, groups: [{id, title, items: []}]}, entries: [...] }
    
    const areaId = runData.area_id;
    const area = areaList.find(a => String(a.id) === String(areaId)) || { 
      id: areaId || `area-${runData.id}`, 
      name: runData.area?.name || `Khu vực #${areaId || '?'}`, 
      type: 'GENERAL' 
    } as Area;
    
    const entries = runData.entries || [];
    
    // Flatten all items from all groups
    const allItems: any[] = [];
    if (runData.template?.groups) {
      for (const group of runData.template.groups) {
        if (group.items) {
          allItems.push(...group.items);
        }
      }
    }
    
    // Map items with their entry values
    const items = allItems.map((it: any) => {
      const entry = entries.find((e: any) => e.item_id === it.id);
      let status: any;
      if (entry?.value === 'ok') status = 'PASS';
      else if (entry?.value === 'not_ok') status = 'FAIL';
      
      return {
        id: String(it.id),
        text: it.title || it.content || 'Item',  // Use title from database
        isCritical: !!it.is_critical,
        status,
        note: entry?.note,
        photoUrl: entry?.photo_url
      };
    });

    // Map status (both old status and new work_status)
    let mappedStatus = ChecklistStatus.PENDING;
    if (runData.status === 'in_progress') mappedStatus = ChecklistStatus.IN_PROGRESS;
    else if (runData.status === 'completed') mappedStatus = ChecklistStatus.COMPLETED;
    else if (runData.status === 'reviewed') mappedStatus = ChecklistStatus.REVIEWED;

    // Map work_status to WorkStatus enum
    let workStatus = runData.work_status as WorkStatus;
    if (!workStatus) {
      // Fallback: convert old status to work_status
      if (runData.status === 'pending') workStatus = WorkStatus.PENDING;
      else if (runData.status === 'in_progress') workStatus = WorkStatus.IN_PROGRESS;
      else if (runData.status === 'completed') workStatus = WorkStatus.COMPLETED;
      else if (runData.status === 'reviewed') workStatus = WorkStatus.APPROVED;
      else workStatus = WorkStatus.PENDING;
    }

    return {
      id: String(runData.id),
      templateName: runData.template?.name || 'Checklist',
      area,
      shift: 'Ca A',  // Can be enhanced later
      date: runData.scheduled_for || runData.date || new Date().toISOString().split('T')[0],
      status: mappedStatus,
      workStatus: workStatus, // ✅ NEW: Use this for review workflow
      items,
      assignedTo: runData.assigned_to ? String(runData.assigned_to) : '',
      verifiedBy: runData.verified_by ? String(runData.verified_by) : undefined,
      completedAt: runData.completed_at,
      verifiedAt: runData.verified_at
    };
  };

  const loadRunsFromApi = async (areasOverride?: Area[]) => {
    if (isFetchingRuns) return;
    if (import.meta.env.DEV) console.log('[loadRunsFromApi] Called from:', new Error().stack?.split('\n')[2]?.trim());
    setIsFetchingRuns(true);
    try {
      // Load runs; for STAFF, request only assigned runs
      const params: any = user && user.role === Role.STAFF 
        ? { assigned_to: Number(user.id), per_page: 1000 } 
        : { per_page: 1000 };
      
      const resp = await runService.list(params);
      
      // Handle paginated response
      const apiRuns: any[] = resp.data || resp || [];
      const areaList = areasOverride || areas;
      
      const mapped = apiRuns.map(run => mapRunToChecklist(run, areaList));
      if (import.meta.env.DEV) console.log('Loaded runs:', mapped.length, 'runs with items');
      
      setChecklists(mapped);
    } catch (e) {
      console.error('Load runs error:', e);
      reportError('Failed to load runs from API', e, 'Không tải được checklist');
    } finally {
      setIsFetchingRuns(false);
    }
  };

  // --- SUPERVISOR NOTIFICATIONS (polling for runs needing review) ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const isSupervisor = user && (user.role === Role.SUPERVISOR || user.role === Role.MANAGER);
    if (!isSupervisor) {
      setPendingReviewCount(0);
      return;
    }
    let cancelled = false;
    const fetchPending = async () => {
      try {
        const resp = await runService.list({ status: 'completed' });
        const runs = (resp as any).data || resp || [];
        if (!cancelled) setPendingReviewCount(Array.isArray(runs) ? runs.length : 0);
      } catch (e) {
        // Silent failure; do not spam notifications
      }
    };
    fetchPending();
    const id = setInterval(fetchPending, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user]);

  // --- INCIDENTS AUTO-REFRESH ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setInterval(() => {
      loadIncidentsFromApi();
    }, 60000);
    return () => clearInterval(id);
  }, []); // Empty deps - only setup once on mount

  // --- STAFF LOGIN SUMMARY NOTIFICATION ---
  const notifyStaffSummary = async () => {
    try {
      if (!user || user.role !== Role.STAFF) return;
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const storageKey = `daily_summary_${user.id}_${todayStr}`;
      if (localStorage.getItem(storageKey)) return; // avoid duplicate per day

      // Today tasks (pending/in_progress)
      const todayResp = await runService.list({ date: todayStr, assigned_to: Number(user.id) });
      const todayRuns: any[] = todayResp.data || todayResp || [];
      const todayActive = todayRuns.filter(r => ['pending','in_progress','draft'].includes(r.status));

      // Unfinished tasks from previous days (pending/in_progress and scheduled_for < today)
      const recentResp = await runService.list({ assigned_to: Number(user.id) });
      const recentRuns: any[] = recentResp.data || recentResp || [];
      const unfinished = recentRuns.filter(r => {
        const d = (r.scheduled_for || r.date || todayStr).split('T')[0];
        return (r.status === 'pending' || r.status === 'in_progress') && d < todayStr;
      });

      // Tomorrow scheduled tasks
      const tomorrowResp = await runService.list({ date: tomorrowStr, assigned_to: Number(user.id) });
      const tomorrowRuns: any[] = tomorrowResp.data || tomorrowResp || [];

      if (todayActive.length > 0) {
        const top = todayActive.slice(0, 2).map(r => `${r.template?.name || 'Checklist'} • ${r.area?.name || 'Khu vực'}`).join(' | ');
        addNotification('Nhiệm vụ hôm nay', `Bạn có ${todayActive.length} checklist cần làm. ${top ? 'Ví dụ: ' + top : ''}`, 'NORMAL');
      }
      if (unfinished.length > 0) {
        addNotification('Việc chưa hoàn thành', `Còn ${unfinished.length} checklist từ các ngày trước cần hoàn tất`, 'CRITICAL');
      }
      if (tomorrowRuns.length > 0) {
        const top2 = tomorrowRuns.slice(0, 2).map(r => `${r.template?.name || 'Checklist'} • ${r.area?.name || 'Khu vực'}`).join(' | ');
        addNotification('Chuẩn bị cho ngày mai', `Dự kiến có ${tomorrowRuns.length} checklist. ${top2 ? 'Ví dụ: ' + top2 : ''}`, 'NORMAL');
      }

      localStorage.setItem(storageKey, '1');
    } catch (e) {
      console.warn('Staff summary notification failed:', e);
    }
  };

  useEffect(() => {
    if (currentTab === 'admin' && !canAccessAdmin) {
      setCurrentTab('dashboard');
      addNotification('Quyền hạn', 'Bạn không có quyền truy cập trang Quản trị', 'CRITICAL');
    }
  }, [currentTab, canAccessAdmin]);

  // --- HANDLERS ---

  const handleLogin = (userFromLogin: User) => {
    if (import.meta.env.DEV) console.log('App.handleLogin called with user:', userFromLogin);
    setUser(userFromLogin);
    addNotification('Đăng nhập thành công', `Chào mừng ${userFromLogin.name}!`, 'SUCCESS');
    setCurrentTab('dashboard');
    // Trigger daily login summary for staff
    setTimeout(() => { notifyStaffSummary(); }, 300);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('api_token');
    localStorage.removeItem('current_user');
    db.clearSession();
    setCurrentTab('dashboard');
    addNotification('Đăng xuất', 'Đã đăng xuất thành công', 'NORMAL');
  };

  // --- USER HANDLERS ---
  const handleAddUser = async (name: string, email: string, role: Role, password?: string) => {
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeEmail(email);
    
    if (!cleanName || cleanName.length < 2) {
      addNotification('Lỗi', 'Tên phải có ít nhất 2 ký tự', 'CRITICAL');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      addNotification('Lỗi', 'Email không hợp lệ', 'CRITICAL');
      return;
    }
    if (!password) {
      addNotification('Lỗi', 'Cần mật khẩu cho người dùng mới', 'CRITICAL');
      return;
    }
    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      addNotification('Lỗi', pwdCheck.message, 'CRITICAL');
      return;
    }
    try {
      const created = await userService.create({ name: cleanName, email: cleanEmail, role, password });
      const mapped = mapApiUser(created);
      setUsers(prev => [...prev, mapped]);
      addNotification('Thêm nhân sự', `Đã thêm tài khoản cho ${cleanName}`, 'SUCCESS');
    } catch (e: any) {
      reportError('Create user failed', e, 'Không tạo được người dùng');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    const payload: any = {};
    if (updates.name) {
      const cleanName = sanitizeInput(updates.name);
      if (cleanName.length < 2) {
        addNotification('Lỗi', 'Tên phải có ít nhất 2 ký tự', 'CRITICAL');
        return;
      }
      payload.name = cleanName;
    }
    if (updates.email) {
      const cleanEmail = sanitizeEmail(updates.email);
      if (!isValidEmail(cleanEmail)) {
        addNotification('Lỗi', 'Email không hợp lệ', 'CRITICAL');
        return;
      }
      payload.email = cleanEmail;
    }
    if (updates.role) payload.role = updates.role;
    if ((updates as any).password) {
      const pwdCheck = validatePasswordStrength((updates as any).password);
      if (!pwdCheck.valid) {
        addNotification('Lỗi', pwdCheck.message, 'CRITICAL');
        return;
      }
      payload.password = (updates as any).password;
    }
    try {
      const updatedUser = await userService.update(Number(userId), payload);
      const mapped = mapApiUser(updatedUser);
      setUsers(prev => prev.map(u => String(u.id) === String(userId) ? mapped : u));
      if (String(userId) === String(user?.id)) setUser(mapped);
      addNotification('Cập nhật', 'Thông tin nhân sự đã được lưu', 'SUCCESS');
    } catch (e: any) {
      reportError('Update user failed', e, 'Không cập nhật được người dùng');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert("Bạn không thể xóa tài khoản của chính mình!");
      return;
    }
    if (window.confirm("Xác nhận xóa vĩnh viễn nhân viên này?")) {
      try {
        await userService.delete(Number(userId));
        setUsers(prev => prev.filter(u => String(u.id) !== String(userId)));
        addNotification('Đã xóa', 'Tài khoản nhân sự đã bị xóa', 'NORMAL');
      } catch (e: any) {
        reportError('Delete user failed', e, 'Không xóa được người dùng');
      }
    }
  };

  // --- AREA HANDLERS ---
  const handleAddArea = async (name: string, type: string) => {
    const cleanName = sanitizeInput(name);
    if (!cleanName || cleanName.length < 2) {
      addNotification('Lỗi', 'Tên khu vực phải có ít nhất 2 ký tự', 'CRITICAL');
      return;
    }
    try {
      const created = await areaService.create({ name: cleanName, type });
      const mapped: Area = { id: created.id, name: created.name, type: created.type || type, description: created.description };
      setAreas(prev => [...prev, mapped]);
      addNotification('Khu vực', `Đã thêm khu vực: ${mapped.name}`, 'SUCCESS');
    } catch (e: any) {
      reportError('Create area failed', e, 'Không tạo được khu vực');
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (!window.confirm("Xóa khu vực này sẽ không xóa các checklist cũ, bạn chắc chắn chứ?")) return;
    try {
      await areaService.delete(Number(id));
      setAreas(prev => prev.filter(a => String(a.id) !== String(id)));
      addNotification('Đã xóa', 'Khu vực đã được xóa', 'NORMAL');
    } catch (e: any) {
      reportError('Delete area failed', e, 'Không xóa được khu vực');
    }
  };

  const handleUpdateArea = async (id: string, name: string, type: string) => {
    const cleanName = sanitizeInput(name);
    if (!cleanName || cleanName.length < 2) {
      addNotification('Lỗi', 'Tên khu vực phải có ít nhất 2 ký tự', 'CRITICAL');
      return;
    }
    try {
      const updated = await areaService.update(Number(id), { name: cleanName, type });
      const mapped: Area = { id: updated.id, name: updated.name, type: updated.type || type, description: updated.description };
      setAreas(prev => prev.map(a => String(a.id) === String(id) ? mapped : a));
      addNotification('Cập nhật', `Đã cập nhật khu vực: ${mapped.name}`, 'SUCCESS');
    } catch (e: any) {
      reportError('Update area failed', e, 'Không cập nhật được khu vực');
    }
  };

  // --- SHIFT HANDLERS ---
  const handleAddShift = async (name: string, startTime: string, endTime: string, type: any, applicableAreaIds: string[]) => {
    const newShift: Shift = {
      id: `s-${Date.now()}`,
      name, startTime, endTime, type, applicableAreaIds
    };
    await db.createShift(newShift);
    setShifts(prev => [...prev, newShift]);
    addNotification('Ca làm việc', `Đã thêm ca: ${name}`, 'SUCCESS');
  };

  const handleDeleteShift = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa ca làm việc này?")) {
      await db.deleteShift(id);
      setShifts(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleCreateTemplate = async (data: { name: string; description?: string; groupTitle: string; itemTitles: string[]; columnLabel: string }) => {
    const name = data.name.trim();
    const groupTitle = data.groupTitle.trim();
    const itemTitles = data.itemTitles.map(t => t.trim()).filter(Boolean);
    if (!name) {
      addNotification('Thiếu dữ liệu', 'Vui lòng nhập tên template', 'CRITICAL');
      return;
    }
    if (!groupTitle) {
      addNotification('Thiếu dữ liệu', 'Vui lòng nhập tên nhóm hạng mục', 'CRITICAL');
      return;
    }
    if (!itemTitles.length) {
      addNotification('Thiếu dữ liệu', 'Cần ít nhất một hạng mục', 'CRITICAL');
      return;
    }
    try {
      const payload = {
        name,
        description: data.description,
        version: 'v1',
        is_active: true,
        groups: [
          {
            title: groupTitle,
            items: itemTitles.map(title => ({ title }))
          }
        ],
        columns: [
          {
            label: data.columnLabel.trim() || 'Ca A',
            type: 'text'
          }
        ]
      };
      const created = await templateService.create(payload as any);
      setTemplates(prev => [created, ...prev]);
      addNotification('Template', 'Đã tạo mẫu checklist mới', 'SUCCESS');
    } catch (e: any) {
      reportError('Create template failed', e, 'Không tạo được template');
    }
  };

  // --- CHECKLIST HANDLERS ---
  const handleAddChecklist = async (
    templateName: string, 
    areaId: string, 
    shift: string, 
    items: {text: string, isCritical: boolean}[],
    assignedTo: string = '',
    verifiedBy: string = ''
  ) => {
    const area = areas.find(a => String(a.id) === String(areaId));
    if (!area) {
      addNotification('Thiếu dữ liệu', 'Vui lòng chọn khu vực hợp lệ', 'CRITICAL');
      return;
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const run = await runService.create(Number(area.id), today);
      // Optional: assign immediately if provided
      if (assignedTo || verifiedBy) {
        // Backend returns plain run object with id property
        const runId = (run as any).id || (run as any).run?.id;
        await runService.update(runId, {
          assigned_to: assignedTo ? Number(assignedTo) : undefined,
          verified_by: verifiedBy ? Number(verifiedBy) : undefined
        });
      }
      await loadRunsFromApi();
      addNotification('Checklist Mới', `Đã tạo checklist cho ${area.name}`, 'SUCCESS');
    } catch (e: any) {
      reportError('Create checklist failed', e, 'Không tạo được checklist');
    }
  };

  const handleAssignChecklist = async (checklistId: string, updates: { assignedTo?: string, verifiedBy?: string }) => {
    try {
      await runService.update(Number(checklistId), {
        assigned_to: updates.assignedTo ? Number(updates.assignedTo) : undefined,
        verified_by: updates.verifiedBy ? Number(updates.verifiedBy) : undefined
      });
      await loadRunsFromApi();
      addNotification('Phân công', 'Đã cập nhật phân công checklist', 'SUCCESS');
    } catch (e: any) {
      reportError('Assign checklist failed', e, 'Không cập nhật được phân công');
    }
  };

  // --- CLONE/DAILY TASK GENERATOR ---
  const handleCloneChecklistsToToday = async () => {
    // Reload runs to refresh the list with latest data from backend
    await loadRunsFromApi();
    addNotification('Đã làm mới', 'Danh sách công việc đã được cập nhật từ hệ thống', 'SUCCESS');
  };

  const handleUpdateIncidentStatus = async (id: string, s: IncidentStatus, resolutionNote?: string) => {
    try {
      await incidentService.update(Number(id), { status: s, resolution_note: resolutionNote });
      await loadIncidentsFromApi();
      if (s === IncidentStatus.RESOLVED) {
        addNotification('Đã xử lý', 'Sự cố đã được đánh dấu hoàn thành', 'SUCCESS');
      }
    } catch (e: any) {
      // If 404, the incident no longer exists - just reload to refresh the list
      if (e.message?.includes('404') || e.statusCode === 404) {
        if (import.meta.env.DEV) console.log(`Incident ${id} not found, refreshing list...`);
        await loadIncidentsFromApi();
        addNotification('Đã làm mới', 'Danh sách sự cố đã được cập nhật', 'NORMAL');
      } else {
        reportError('Update incident failed', e, 'Không cập nhật được sự cố');
      }
    }
  };

  const handleAssignIncident = async (id: string, userId: number) => {
    try {
      await incidentService.assign(Number(id), userId);
      await loadIncidentsFromApi();
      const assignedUser = users.find(u => String(u.id) === String(userId));
      addNotification('Đã gán', `Sự cố đã được gán cho ${assignedUser?.name || 'người dùng'}`, 'SUCCESS');
    } catch (e: any) {
      reportError('Assign incident failed', e, 'Không gán được sự cố');
    }
  };

  const handleCreateIncident = async (data: { title: string, description: string, area: string, priority: IncidentPriority, reportedBy: string }) => {
    const cleanTitle = sanitizeInput(data.title);
    const cleanDescription = sanitizeInput(data.description);
    
    if (!cleanTitle || cleanTitle.length < 3) {
      addNotification('Lỗi', 'Tiêu đề sự cố phải có ít nhất 3 ký tự', 'CRITICAL');
      return;
    }
    
    try {
      const areaMatch = areas.find(a => a.name === data.area || String(a.id) === data.area);
      if (!areaMatch) {
        addNotification('Thiếu dữ liệu', 'Vui lòng chọn khu vực hợp lệ', 'CRITICAL');
        return;
      }
      await incidentService.create({
        area_id: Number(areaMatch.id),
        title: cleanTitle,
        description: cleanDescription,
        severity: data.priority
      });
      await loadIncidentsFromApi();
      const isUrgent = data.priority === IncidentPriority.CRITICAL || data.priority === IncidentPriority.HIGH;
      addNotification(
        isUrgent ? 'CẢNH BÁO SỰ CỐ' : 'Sự cố mới', 
        `${cleanTitle} - ${areaMatch.name}`, 
        isUrgent ? 'CRITICAL' : 'NORMAL'
      );
    } catch (e: any) {
      reportError('Create incident failed', e, 'Không tạo được sự cố');
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
        // Find existing checklists for this area even if not assigned to me (maybe general info)
        addNotification('Khu vực hợp lệ', 'Bạn không có checklist nào cần làm tại đây.', 'NORMAL');
      } else {
        addNotification('Không tìm thấy', `Mã QR không khớp khu vực nào trong hệ thống.`, 'CRITICAL');
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

  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );

  const renderContent = () => {
    if (activeChecklist) {
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ChecklistExecution 
            checklist={activeChecklist} 
            currentUser={user}
            runContext={activeRunContext || undefined}
            onBack={() => { setActiveChecklist(null); setActiveRunContext(null); }} 
            onComplete={async (updated) => {
              try {
                if (activeRunContext) {
                  await loadRunsFromApi();
                }
                setActiveChecklist(null);
                setActiveRunContext(null);
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
               await handleCreateIncident({
                 title: t,
                 description: d,
                 area: a,
                 priority: IncidentPriority.MEDIUM,
                 reportedBy: user.name
               });
            }}
          />
          </Suspense>
        );
      }

    switch (currentTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard user={user} users={users} checklists={checklists} incidents={incidents} onChangeTab={setCurrentTab} onLogout={handleLogout} onOpenScanner={() => setShowScanner(true)} />
          </Suspense>
        );
      case 'checklists':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Checklists checklists={checklists} onSelectChecklist={async (id) => {
          try {
            const runId = Number(id);
            const detail = await runService.get(runId);
            const areaList = areas.length ? areas : await loadAreasFromApi();
            const mapped = mapRunToChecklist(detail, areaList);
            // API trả về cột nằm trong template.columns (không phải detail.columns)
            const columns = (detail as any).columns || detail.template?.columns || [];
            const roles = detail.roles || [];
            const lowerRole = (user.role || '').toLowerCase();
            const matchedColumn = columns.find((c: any) => {
              const colRoleName = (c.role_name || '').toLowerCase();
              if (colRoleName && colRoleName === lowerRole) return true;
              const colRole = roles.find((r: any) => String(r.id) === String(c.role_id));
              return colRole ? (colRole.name || '').toLowerCase() === lowerRole : false;
            }) || columns[0];
            const columnId = matchedColumn?.id || runId; // column_id phải khớp template_columns.id
            const sessionId = matchedColumn?.session_id || detail.sessions?.[0]?.id;
            const roleId = matchedColumn?.role_id || roles.find((r: any) => (r.name || '').toLowerCase() === lowerRole)?.id;
            setActiveChecklist(mapped);
            setActiveRunContext({ runId, columnId, sessionId, roleId });
          } catch (e) {
            console.error('Load run detail failed:', e);
            addNotification('Lỗi', 'Không tải được checklist', 'CRITICAL');
          }
        }} currentUser={user} users={users} />
          </Suspense>
        );
      case 'incidents':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Incidents 
            incidents={incidents} 
            currentUser={user}
            users={users}
            areas={areas}
            onUpdateStatus={handleUpdateIncidentStatus}
            onCreateIncident={handleCreateIncident}
            onAssignIncident={handleAssignIncident}
          />
          </Suspense>
        );
      case 'reports':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Reports checklists={checklists} incidents={incidents} users={users} />
          </Suspense>
        );
      case 'admin':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Admin 
            currentUser={user} // Pass currentUser to Admin
            users={users} 
            checklists={checklists}
            areas={areas}
            templates={templates}
            shifts={shifts}
            onAddUser={handleAddUser} 
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAddChecklist={handleAddChecklist} 
            onAssignChecklist={handleAssignChecklist}
            onAddArea={handleAddArea}
            onUpdateArea={handleUpdateArea}
            onDeleteArea={handleDeleteArea}
            onAddShift={handleAddShift}
            onDeleteShift={handleDeleteShift}
            onCloneDaily={handleCloneChecklistsToToday} 
            onCreateTemplate={handleCreateTemplate}
            onRunsChanged={loadRunsFromApi}
            onTemplatesChanged={loadTemplatesFromApi}
          />
          </Suspense>
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
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-4 text-red-600 font-bold hover:bg-red-50 rounded-2xl transition-colors">
                  <LogOut size={20} />
                  Đăng xuất
                </button>
             </div>
             <p className="text-center text-xs text-gray-400">EcoCheck Ops v3.7.0</p>
          </div>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard user={user} users={users} checklists={checklists} incidents={incidents} onChangeTab={setCurrentTab} onLogout={handleLogout} onOpenScanner={() => setShowScanner(true)} />
          </Suspense>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl overflow-hidden relative">
      <div className="pb-20">{renderContent()}</div>
      {!activeChecklistId && (
        <Navigation 
          currentTab={currentTab} 
          onTabChange={setCurrentTab} 
          role={user.role} 
          pendingReviewCount={pendingReviewCount}
        />
      )}
      
      {/* QR Scanner Overlay */}
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
            className={`pointer-events-auto w-full max-w-sm rounded-2xl p-4 shadow-2xl border flex items-start gap-3 animate-in slide-in-from-top-5 fade-in duration-300 ${
              n.type === 'CRITICAL' 
                ? 'bg-red-600 text-white border-red-700' 
                : n.type === 'SUCCESS' 
                  ? 'bg-green-600 text-white border-green-700'
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
