
import React, { useState, useEffect } from 'react';
import { User, Role, Checklist, Area, Shift } from '../types';
import { templateService } from '../services/templateService';
import { runService } from '../services/runService';
import { AdminStaffStats } from '../components/AdminStaffStats';
import { AdminSupervisorStats } from '../components/AdminSupervisorStats';
import { Plus, X, Users, ClipboardList, UserCheck, AlertCircle, Lock, Trash2, Eye, EyeOff, Edit, Edit2, PlusCircle, MinusCircle, ShieldCheck, KeyRound, MapPin, QrCode, Clock, Layers, TrendingUp, BarChart3, FileSpreadsheet } from 'lucide-react';

interface AdminProps {
  currentUser: User;
  users: User[];
  checklists?: Checklist[];
  areas?: Area[];
  templates?: any[];
  shifts?: Shift[];
  onAddUser: (name: string, email: string, role: Role, password?: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  onAddChecklist: (templateName: string, areaId: string, shift: string, items: { text: string, isCritical: boolean }[], assignedTo?: string, verifiedBy?: string) => void;
  onAssignChecklist?: (checklistId: string, updates: { assignedTo?: string, verifiedBy?: string }) => void;
  onAddArea?: (name: string, type: string) => void;
  onUpdateArea?: (id: string, name: string, type: string) => void;
  onDeleteArea?: (id: string) => void;
  onAddShift?: (name: string, startTime: string, endTime: string, type: any, applicableAreaIds: string[]) => void;
  onDeleteShift?: (id: string) => void;
  onCloneDaily?: () => void;
  onCreateTemplate?: (data: { areaId: string; name: string; description?: string; groupTitle: string; itemTitles: string[]; columnLabel: string }) => void;
  onRunsChanged?: () => void;
  onTemplatesChanged?: () => void;
}

export const Admin: React.FC<AdminProps> = ({
  currentUser,
  users, checklists = [], areas = [], templates = [], shifts = [],
  onAddUser, onUpdateUser, onDeleteUser,
  onAddChecklist, onAssignChecklist,
  onAddArea, onUpdateArea, onDeleteArea,
  onAddShift, onDeleteShift,
  onCloneDaily,
  onCreateTemplate,
  onRunsChanged,
  onTemplatesChanged
}) => {
  // Determine available tabs based on Role
  const getAvailableTabs = () => {
    if (currentUser.role === Role.ADMIN) {
      return [
        { id: 'STAFF_STATS', label: 'Thống kê NS', icon: BarChart3 },
        { id: 'SUPERVISOR_STATS', label: 'Thống kê GS', icon: TrendingUp },
        { id: 'ASSIGN_WORK', label: 'Gán việc', icon: UserCheck },
        { id: 'USERS', label: 'NS', icon: Users },
        { id: 'AREAS', label: 'Khu vực', icon: MapPin },
        { id: 'SHIFTS', label: 'Ca trực', icon: Clock },
        { id: 'CHECKLISTS', label: 'Mẫu', icon: ClipboardList },
        { id: 'TEMPLATES', label: 'Template', icon: Layers }
      ];
    } else if (currentUser.role === Role.MANAGER) {
      return [
        { id: 'STAFF_STATS', label: 'Thống kê NS', icon: BarChart3 },
        { id: 'SUPERVISOR_STATS', label: 'Thống kê GS', icon: TrendingUp },
        { id: 'ASSIGN_WORK', label: 'Gán việc', icon: UserCheck },
        { id: 'SHIFTS', label: 'Ca trực', icon: Clock },
        { id: 'CHECKLISTS', label: 'Mẫu', icon: ClipboardList },
        { id: 'TEMPLATES', label: 'Template', icon: Layers }
      ];
    } else if (currentUser.role === Role.SUPERVISOR) {
      // Supervisor can manage runs and shifts
      return [
        { id: 'ASSIGN_WORK', label: 'Gán việc', icon: UserCheck },
        { id: 'SHIFTS', label: 'Ca trực', icon: Clock },
        { id: 'CHECKLISTS', label: 'Mẫu', icon: ClipboardList }
      ];
    }
    return [];
  };

  const availableTabs = getAvailableTabs();
  const [activeTab, setActiveTab] = useState<string>(availableTabs.length > 0 ? availableTabs[0].id : '');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [currentUser.role]);


  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState({ name: '', email: '', role: Role.STAFF, password: '' });
  const [showPwd, setShowPwd] = useState(false);

  // Area Modal State
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaData, setAreaData] = useState({ name: '', type: 'F&B' });

  // Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ areaId: '', name: '', description: '', groupTitle: 'Khu vực', columnLabel: 'Ca A', itemTitles: [''] });

  // Shift Modal State
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftData, setShiftData] = useState<{ name: string, startTime: string, endTime: string, type: any, applicableAreaIds: string[] }>({
    name: '', startTime: '08:00', endTime: '16:00', type: 'NORMAL', applicableAreaIds: []
  });

  // Checklist Modal State
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistData, setChecklistData] = useState({
    templateName: '', areaId: '', shift: '',
    assignedTo: '', verifiedBy: '',
    items: [{ text: '', isCritical: false }]
  });

  // Assign Work Modal State
  const [showAssignWorkModal, setShowAssignWorkModal] = useState(false);
  const [assignWorkData, setAssignWorkData] = useState({
    templateId: '',
    areaId: '',
    assignedTo: '',
    verifiedBy: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Edit Template Modal State
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editTemplateData, setEditTemplateData] = useState<{
    name: string;
    description: string;
    is_active: boolean;
    groups: Array<{
      id?: number;
      title: string;
      items: Array<{ id?: number; title: string; is_critical: boolean; instructions?: string }>;
    }>;
    columns: Array<{ id?: number; label: string; type?: string; options?: string }>;
  }>({
    name: '',
    description: '',
    is_active: true,
    groups: [],
    columns: []
  });

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [importAreaId, setImportAreaId] = useState<string>('');

  const handleImportTemplate = async () => {
    if (!importFile) return;
    if (!importAreaId) {
      alert('Vui lòng chọn khu vực cho template import');
      return;
    }
    setIsSubmitting(true);
    try {
      await templateService.import(importFile, importName, importAreaId);
      alert('✅ Import thành công!');
      setShowImportModal(false);
      setImportFile(null);
      setImportName('');
      setImportAreaId('');
      if (onTemplatesChanged) onTemplatesChanged();
    } catch (e) {
      alert('❌ Lỗi: ' + (e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers
  const handleOpenUserModal = (u?: User) => {
    if (u) {
      setEditingUserId(u.id);
      setUserData({ name: u.name, email: u.email, role: u.role, password: '' });
    } else {
      setEditingUserId(null);
      setUserData({ name: '', email: '', role: Role.STAFF, password: '' });
    }
    setShowUserModal(true);
  };

  const handleSubmitUser = async () => {
    if (!userData.name || !userData.email) {
      alert("Vui lòng nhập tên và email");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUserId) {
        const updates: Partial<User> = {
          name: userData.name,
          email: userData.email,
          role: userData.role
        };
        if (userData.password && userData.password.trim() !== '') {
          updates.password = userData.password;
        }
        await onUpdateUser(editingUserId, updates);
      } else {
        if (!userData.password) { alert("Phải có mật khẩu cho người dùng mới"); return; }
        await onAddUser(userData.name, userData.email, userData.role, userData.password);
      }
      setShowUserModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitArea = async () => {
    if (!areaData.name) { alert("Vui lòng nhập tên khu vực"); return; }
    setIsSubmitting(true);
    try {
      if (editingAreaId) {
        await onUpdateArea?.(editingAreaId, areaData.name, areaData.type);
      } else {
        await onAddArea?.(areaData.name, areaData.type);
      }
      setAreaData({ name: '', type: 'F&B' });
      setEditingAreaId(null);
      setShowAreaModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitShift = () => {
    if (!shiftData.name || !shiftData.startTime || !shiftData.endTime) {
      alert("Vui lòng nhập đầy đủ tên và thời gian ca");
      return;
    }
    onAddShift?.(shiftData.name, shiftData.startTime, shiftData.endTime, shiftData.type, shiftData.applicableAreaIds);
    setShiftData({ name: '', startTime: '08:00', endTime: '16:00', type: 'NORMAL', applicableAreaIds: [] });
    setShowShiftModal(false);
  };

  const handleSubmitTemplate = () => {
    if (!templateForm.areaId) {
      alert('Vui lòng chọn khu vực');
      return;
    }
    if (!templateForm.name || !templateForm.groupTitle) {
      alert('Vui lòng nhập tên template và nhóm');
      return;
    }
    const items = templateForm.itemTitles.map(i => i.trim()).filter(Boolean);
    if (items.length === 0) {
      alert('Cần ít nhất 1 hạng mục');
      return;
    }
    onCreateTemplate?.({
      areaId: templateForm.areaId,
      name: templateForm.name,
      description: templateForm.description,
      groupTitle: templateForm.groupTitle,
      itemTitles: items,
      columnLabel: templateForm.columnLabel || 'Ca A'
    });
    setTemplateForm({ areaId: '', name: '', description: '', groupTitle: 'Khu vực', columnLabel: 'Ca A', itemTitles: [''] });
    setShowTemplateModal(false);
  };

  const handleSubmitChecklist = () => {
    const { templateName, areaId, shift, items, assignedTo, verifiedBy } = checklistData;
    const validItems = items.filter(i => i.text.trim() !== '');
    if (!templateName || !areaId || !shift || validItems.length === 0) {
      alert("Vui lòng chọn khu vực, ca làm việc và ít nhất 1 đầu mục.");
      return;
    }
    onAddChecklist(templateName, areaId, shift, validItems, assignedTo, verifiedBy);
    setShowChecklistModal(false);
    setChecklistData({
      templateName: '', areaId: '', shift: '',
      assignedTo: '', verifiedBy: '',
      items: [{ text: '', isCritical: false }]
    });
  };

  // Helper to filter valid shifts for checklist modal
  const getAvailableShiftsForArea = (areaId: string) => {
    if (!areaId) return [];
    return shifts.filter(s => s.applicableAreaIds.length === 0 || s.applicableAreaIds.includes(areaId));
  };

  // Handler for Assign Work
  const handleSubmitAssignWork = async () => {
    const { templateId, areaId, assignedTo, verifiedBy, date } = assignWorkData;
    if (!templateId || !areaId || !date) {
      alert('Vui lòng điền đầy đủ: Template, Khu vực và Ngày.');
      return;
    }

    try {
      // 1) Tạo run theo API backend (area_id + date + template)
      const createdRun = await runService.create(Number(areaId), date, Number(templateId));
      const runId = createdRun?.id || createdRun?.run?.id;

      // 2) Nếu có người thực hiện/giám sát, cập nhật run
      if (runId && (assignedTo || verifiedBy)) {
        await runService.update(runId, {
          assigned_to: assignedTo ? Number(assignedTo) : undefined,
          verified_by: verifiedBy ? Number(verifiedBy) : undefined,
        });
      }

      alert('✅ Đã gán việc thành công!');
      setShowAssignWorkModal(false);
      setAssignWorkData({
        templateId: '', areaId: '', assignedTo: '', verifiedBy: '',
        date: new Date().toISOString().split('T')[0]
      });

      // Notify parent to reload runs
      if (onRunsChanged) onRunsChanged();
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    }
  };

  // Handler for Edit Template
  const handleOpenEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setEditTemplateData({
      name: template.name || '',
      description: template.description || '',
      is_active: !!template.is_active,
      groups: template.groups?.map((g: any) => ({
        id: g.id,
        title: g.title || '',
        items: g.items?.map((i: any) => ({
          id: i.id,
          title: i.title || '',
          is_critical: i.is_critical || false,
          instructions: i.instructions || ''
        })) || []
      })) || []
      ,
      columns: template.columns?.map((c: any) => ({
        id: c.id,
        label: c.label || '',
        type: c.type || 'text',
        options: Array.isArray(c.options) ? c.options.join(',') : (c.options || '')
      })) || []
    });
    setShowEditTemplateModal(true);
  };

  const handleSaveEditTemplate = async () => {
    if (!editTemplateData.name) {
      alert('Vui lòng nhập tên template');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: editTemplateData.name,
        description: editTemplateData.description,
        is_active: editTemplateData.is_active,
        groups: editTemplateData.groups.map(g => ({
          id: g.id,
          title: g.title,
          items: g.items.map(i => ({
            id: i.id,
            title: i.title,
            instructions: i.instructions,
            is_critical: i.is_critical
          }))
        })),
        columns: editTemplateData.columns.map(c => ({
          id: c.id,
          label: c.label,
          type: c.type || 'text',
          options: (c.options || '').split(',').map(o => o.trim()).filter(Boolean)
        }))
      };

      await templateService.update(editingTemplate.id, payload as any);

      alert('✅ Đã cập nhật template thành công!');
      setShowEditTemplateModal(false);
      if (onTemplatesChanged) onTemplatesChanged();
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('Xác nhận xóa template này? Hành động này sẽ xóa cả nhóm, hạng mục và checklist liên quan.')) return;
    try {
      await templateService.delete(id);
      alert('✅ Đã xóa template');
      if (onTemplatesChanged) onTemplatesChanged();
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (!window.confirm('Xác nhận xóa checklist này?')) return;
    try {
      await runService.delete(Number(runId));
      alert('✅ Đã xóa checklist');
      if (onRunsChanged) onRunsChanged();
    } catch (error) {
      alert('❌ Lỗi: ' + (error as Error).message);
    }
  };

  const _handleAddGroupToTemplate = () => {
    setEditTemplateData({
      ...editTemplateData,
      groups: [...editTemplateData.groups, { title: '', items: [{ title: '', is_critical: false, instructions: '' }] }]
    });
  };

  const _handleRemoveGroupFromTemplate = (groupIdx: number) => {
    setEditTemplateData({
      ...editTemplateData,
      groups: editTemplateData.groups.filter((_, i) => i !== groupIdx)
    });
  };

  const _handleAddItemToGroup = (groupIdx: number) => {
    const newGroups = [...editTemplateData.groups];
    newGroups[groupIdx].items.push({ title: '', is_critical: false, instructions: '' });
    setEditTemplateData({ ...editTemplateData, groups: newGroups });
  };

  const _handleRemoveItemFromGroup = (groupIdx: number, itemIdx: number) => {
    const newGroups = [...editTemplateData.groups];
    newGroups[groupIdx].items = newGroups[groupIdx].items.filter((_, i) => i !== itemIdx);
    setEditTemplateData({ ...editTemplateData, groups: newGroups });
  };

  const _handleUpdateGroupTitle = (groupIdx: number, title: string) => {
    const newGroups = [...editTemplateData.groups];
    newGroups[groupIdx].title = title;
    setEditTemplateData({ ...editTemplateData, groups: newGroups });
  };

  const _handleUpdateItem = (groupIdx: number, itemIdx: number, field: 'title' | 'instructions' | 'is_critical', value: any) => {
    const newGroups = [...editTemplateData.groups];
    if (field === 'is_critical') {
      newGroups[groupIdx].items[itemIdx].is_critical = !!value;
    } else {
      (newGroups[groupIdx].items[itemIdx] as any)[field] = value;
    }
    setEditTemplateData({ ...editTemplateData, groups: newGroups });
  };

  const _handleAddColumn = () => {
    setEditTemplateData({
      ...editTemplateData,
      columns: [...editTemplateData.columns, { label: '', type: 'text', options: '' }]
    });
  };

  const _handleRemoveColumn = (idx: number) => {
    setEditTemplateData({
      ...editTemplateData,
      columns: editTemplateData.columns.filter((_, i) => i !== idx)
    });
  };

  const _handleUpdateColumn = (idx: number, field: 'label' | 'type' | 'options', value: string) => {
    const newCols = [...editTemplateData.columns];
    (newCols[idx] as any)[field] = value;
    setEditTemplateData({ ...editTemplateData, columns: newCols });
  };

  // Security check render
  if (availableTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Lock size={48} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-bold text-gray-800">Không có quyền truy cập</h2>
        <p className="text-sm text-gray-500">Tài khoản {currentUser.role} không được phép truy cập trang quản trị.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản trị hệ thống</h1>
        <div className={`text-[10px] font-bold px-2 py-1 rounded inline-flex items-center gap-1 mt-1 uppercase ${currentUser.role === Role.ADMIN ? 'bg-emerald-100 text-emerald-700' : currentUser.role === Role.MANAGER ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
          <ShieldCheck size={12} />
          Chế độ: {currentUser.role === Role.ADMIN ? 'Toàn quyền (Admin)' : currentUser.role === Role.MANAGER ? 'Quản lý (Manager)' : 'Giám sát (Supervisor)'}
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 shadow-inner overflow-x-auto gap-1">
        {availableTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2 text-[10px] font-bold rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Icon size={16} className="mb-0.5" /> {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {/* --- TAB: STAFF STATS --- */}
        {activeTab === 'STAFF_STATS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-gray-800">Thống Kê Nhân Viên</h2>
            </div>
            <AdminStaffStats />
          </div>
        )}

        {/* --- TAB: SUPERVISOR STATS --- */}
        {activeTab === 'SUPERVISOR_STATS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-gray-800">Thống Kê Giám Sát</h2>
            </div>
            <AdminSupervisorStats />
          </div>
        )}

        {/* --- TAB: USERS --- */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-gray-800">Danh sách ({users.length})</h2>
              <button onClick={() => handleOpenUserModal()} className="bg-brand-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold shadow-lg shadow-brand-100 active:scale-95 transition-transform">
                <Plus size={16} className="mr-1" /> Thêm mới
              </button>
            </div>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center shadow-sm hover:border-brand-200 transition-colors group">
                  <div className="relative">
                    <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full mr-4 border-2 border-brand-50 object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{u.name}</h3>
                    <p className="text-[10px] text-gray-500 truncate mb-1">{u.email}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${u.role === Role.ADMIN ? 'bg-emerald-100 text-emerald-700' :
                      u.role === Role.MANAGER ? 'bg-purple-100 text-purple-700' :
                      u.role === Role.SUPERVISOR ? 'bg-orange-100 text-orange-700' : 'bg-brand-50 text-brand-700'
                      }`}>{u.role}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenUserModal(u)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteUser(u.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: AREAS --- */}
        {activeTab === 'AREAS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-gray-800">Khu vực quản lý ({areas.length})</h2>
              <button onClick={() => setShowAreaModal(true)} className="bg-brand-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold shadow-lg shadow-brand-100">
                <Plus size={16} className="mr-1" /> Thêm khu vực
              </button>
            </div>
            <div className="space-y-3">
              {areas.map(area => (
                <div key={area.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{area.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">{area.type}</span>
                        <span className="text-[10px] text-gray-300 flex items-center gap-1"><QrCode size={10} /> {area.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingAreaId(String(area.id));
                        setAreaData({ name: area.name, type: area.type });
                        setShowAreaModal(true);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDeleteArea?.(String(area.id))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {areas.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Chưa có khu vực nào.</p>}
            </div>
          </div>
        )}

        {/* --- TAB: SHIFTS --- */}
        {activeTab === 'SHIFTS' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-gray-800">Cấu hình Ca ({shifts.length})</h2>
              <button onClick={() => setShowShiftModal(true)} className="bg-brand-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold shadow-lg shadow-brand-100">
                <Plus size={16} className="mr-1" /> Tạo ca
              </button>
            </div>
            <div className="space-y-3">
              {shifts.map(shift => {
                const appliedAreas = areas.filter(a => shift.applicableAreaIds.includes(a.id));
                return (
                  <div key={shift.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                          {shift.name}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${shift.type === 'OPENING' ? 'bg-green-50 text-green-600' :
                            shift.type === 'CLOSING' ? 'bg-red-50 text-red-600' :
                              'bg-gray-100 text-gray-500'
                            }`}>{shift.type}</span>
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-brand-600 font-bold bg-brand-50 w-fit px-2 py-1 rounded-lg">
                          <Clock size={12} /> {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                      <button onClick={() => onDeleteShift?.(shift.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-gray-50">
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Áp dụng cho:</p>
                      <div className="flex flex-wrap gap-1">
                        {shift.applicableAreaIds.length === 0 ? (
                          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold">Toàn bộ hệ thống</span>
                        ) : (
                          appliedAreas.map(a => (
                            <span key={a.id} className="text-[10px] bg-white border border-gray-100 px-2 py-0.5 rounded text-gray-600">
                              {a.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB: CHECKLISTS --- */}
        {activeTab === 'CHECKLISTS' && (
          <div className="space-y-4">
            {/* Quick Actions for Daily Routine */}
            {onCloneDaily && (
              <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-4 rounded-2xl text-white shadow-lg mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">Làm mới dữ liệu</h3>
                    <p className="text-[10px] text-brand-100 opacity-90">Tải lại danh sách công việc từ hệ thống để cập nhật trạng thái mới nhất.</p>
                  </div>
                  <button
                    onClick={onCloneDaily}
                    className="bg-white text-brand-700 px-3 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-brand-50 active:scale-95 transition-transform flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Làm mới
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-gray-800">Mẫu Checklist ({checklists.length})</h2>
              <button onClick={() => setShowChecklistModal(true)} className="bg-brand-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold shadow-lg shadow-brand-100">
                <Plus size={16} className="mr-1" /> Tạo mẫu
              </button>
            </div>

            <div className="space-y-4">
              {checklists.map((cl) => {
                const isUnassigned = !cl.assignedTo || !cl.verifiedBy;
                return (
                  <div key={cl.id} className={`bg-white p-4 rounded-2xl border shadow-sm space-y-4 ${isUnassigned ? 'border-red-100 ring-1 ring-red-50' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{cl.templateName}</h3>
                        <p className="text-[10px] text-gray-500">{cl.area.name} • {cl.shift}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnassigned && <AlertCircle size={16} className="text-red-400" />}
                        <button onClick={() => handleDeleteRun(cl.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-[9px] font-bold uppercase flex items-center gap-1 ${!cl.assignedTo ? 'text-red-500' : 'text-gray-400'}`}>
                          <UserCheck size={10} /> Người thực hiện
                        </label>
                        <select
                          value={cl.assignedTo || ''}
                          onChange={(e) => onAssignChecklist?.(cl.id, { assignedTo: e.target.value })}
                          className={`text-xs p-2.5 rounded-xl border-none font-bold focus:ring-1 outline-none ${!cl.assignedTo ? 'bg-red-50 text-red-600 focus:ring-red-200' : 'bg-gray-50 text-brand-700 focus:ring-brand-500'}`}
                        >
                          <option value="">-- Chưa phân công --</option>
                          {users.filter(u => u.role === Role.STAFF || u.role === Role.MAINTENANCE).map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-[9px] font-bold uppercase flex items-center gap-1 ${!cl.verifiedBy ? 'text-red-500' : 'text-gray-400'}`}>
                          <ShieldCheck size={10} /> Người kiểm tra
                        </label>
                        <select
                          value={cl.verifiedBy || ''}
                          onChange={(e) => onAssignChecklist?.(cl.id, { verifiedBy: e.target.value })}
                          className={`text-xs p-2.5 rounded-xl border-none font-bold focus:ring-1 outline-none ${!cl.verifiedBy ? 'bg-red-50 text-red-600 focus:ring-red-200' : 'bg-purple-50 text-purple-700 focus:ring-purple-500'}`}
                        >
                          <option value="">-- Chưa phân công --</option>
                          {users.filter(u => u.role === Role.ADMIN || u.role === Role.MANAGER || u.role === Role.SUPERVISOR).map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB: TEMPLATES --- */}
        {activeTab === 'TEMPLATES' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-gray-800">Template Checklist ({templates.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setImportAreaId(areas[0]?.id ? String(areas[0].id) : '');
                    setShowImportModal(true);
                  }}
                  className="bg-green-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold shadow-lg shadow-green-100"
                >
                  <FileSpreadsheet size={16} className="mr-1" /> Import Excel
                </button>
                <button onClick={() => setShowTemplateModal(true)} className="bg-brand-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold shadow-lg shadow-brand-100">
                  <Plus size={16} className="mr-1" /> Tạo template
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {templates.map((t: any) => (
                <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{t.name}</h3>
                      <p className="text-[10px] text-gray-500">Version: {t.version || 'v1'} • {t.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleOpenEditTemplate(t)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1"
                      >
                        <Edit size={12} /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
                        className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-bold hover:bg-red-100 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Xóa
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>Nhóm: {t.groups?.length || 0}</span>
                    <span>Hạng mục: {t.groups?.reduce((sum: number, g: any) => sum + (g.items?.length || 0), 0) || 0}</span>
                    <span>Cột: {t.columns?.length || 0}</span>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-center text-gray-400 text-xs py-6">Chưa có template nào.</p>
              )}
            </div>

            {/* Import Template Modal */}
            {showImportModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-lg font-bold mb-4">Import Template từ Excel</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">File Excel (*.xlsx)</label>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-xs"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Hỗ trợ import nhiều sheet cùng lúc.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Tên Template (Tùy chọn)</label>
                      <input
                        type="text"
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        placeholder="Để trống sẽ lấy tên từ file/sheet"
                        className="w-full p-2 border rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Khu vực áp dụng</label>
                      <select
                        value={importAreaId}
                        onChange={(e) => setImportAreaId(e.target.value)}
                        className="w-full p-2 border rounded-xl text-xs"
                      >
                        <option value="">Chọn khu vực</option>
                        {areas.map((a) => (
                          <option key={a.id} value={String(a.id)}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowImportModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs">Hủy</button>
                    <button
                      onClick={handleImportTemplate}
                      disabled={isSubmitting || !importFile}
                      className="flex-[2] py-2.5 bg-brand-600 text-white rounded-xl font-bold text-xs"
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Import Ngay'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: ASSIGN WORK --- */}
        {activeTab === 'ASSIGN_WORK' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-4 rounded-2xl text-white shadow-lg mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm">Gán việc mới</h3>
                  <p className="text-[10px] text-blue-100 opacity-90">Tạo công việc mới cho nhân viên từ template có sẵn.</p>
                </div>
                <button
                  onClick={() => setShowAssignWorkModal(true)}
                  className="bg-white text-purple-700 px-3 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-purple-50 active:scale-95 transition-transform flex items-center gap-1"
                >
                  <UserCheck size={14} /> Gán việc
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-2">Hướng dẫn</h3>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li>Chọn template checklist có sẵn</li>
                <li>Chọn khu vực thực hiện</li>
                <li>Chọn nhân viên thực hiện và người kiểm tra (nếu có)</li>
                <li>Chọn ngày thực hiện công việc</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{editingUserId ? 'Sửa thông tin' : 'Thêm nhân sự'}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Họ tên</label>
                <input type="text" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none" placeholder="VD: Nguyễn Văn A" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
                <input type="email" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none" placeholder="email@ecocheck.vn" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1">
                  {editingUserId ? <><KeyRound size={10} /> Đặt lại mật khẩu</> : 'Mật khẩu'}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={userData.password}
                    onChange={e => setUserData({ ...userData, password: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm pr-10 focus:ring-2 focus:ring-brand-100 outline-none"
                    placeholder={editingUserId ? "Nhập để đổi mật khẩu mới..." : "••••••••"}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vai trò</label>
                <select value={userData.role} onChange={e => setUserData({ ...userData, role: e.target.value as Role })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-100 outline-none">
                  {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button
                onClick={handleSubmitUser}
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '⏳ Đang lưu...' : (editingUserId ? 'Lưu thay đổi' : 'Tạo tài khoản')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AREA MODAL */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{editingAreaId ? 'Sửa khu vực' : 'Thêm khu vực mới'}</h3>
              <button onClick={() => {
                setShowAreaModal(false);
                setEditingAreaId(null);
                setAreaData({ name: '', type: 'F&B' });
              }} className="text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tên khu vực</label>
                <input type="text" value={areaData.name} onChange={e => setAreaData({ ...areaData, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none" placeholder="VD: Bếp Nhà Hàng Âu" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Loại hình</label>
                <select value={areaData.type} onChange={e => setAreaData({ ...areaData, type: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-100 outline-none">
                  <option value="F&B">F&B (Nhà hàng/Bếp)</option>
                  <option value="Hotel">Hotel (Lưu trú)</option>
                  <option value="Facility">Facility (Tiện ích chung)</option>
                  <option value="Garden">Garden (Cảnh quan)</option>
                  <option value="Entertainment">Entertainment (Giải trí)</option>
                  <option value="General">General (Khác)</option>
                </select>
              </div>
              <button
                onClick={handleSubmitArea}
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '⏳ Đang lưu...' : (editingAreaId ? 'Cập nhật' : 'Lưu khu vực')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT MODAL */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Thiết lập Ca làm việc</h3>
              <button onClick={() => setShowShiftModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tên ca</label>
                <input type="text" value={shiftData.name} onChange={e => setShiftData({ ...shiftData, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none" placeholder="VD: Ca Sáng" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bắt đầu</label>
                  <input type="time" value={shiftData.startTime} onChange={e => setShiftData({ ...shiftData, startTime: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none font-bold text-gray-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kết thúc</label>
                  <input type="time" value={shiftData.endTime} onChange={e => setShiftData({ ...shiftData, endTime: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none font-bold text-gray-700" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phân loại</label>
                <select value={shiftData.type} onChange={e => setShiftData({ ...shiftData, type: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none">
                  <option value="NORMAL">Thường</option>
                  <option value="OPENING">Đầu ca (Mở cửa)</option>
                  <option value="HANDOVER">Giao ca</option>
                  <option value="CLOSING">Cuối ca (Đóng cửa)</option>
                </select>
              </div>

              {/* Area Multi-select (Simple Checkboxes) */}
              <div className="space-y-2 pt-2 border-t border-gray-50">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 block">Khu vực áp dụng (Để trống = Tất cả)</label>
                <div className="max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                  {areas.map(area => (
                    <label key={area.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-200">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        checked={shiftData.applicableAreaIds.includes(area.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setShiftData({ ...shiftData, applicableAreaIds: [...shiftData.applicableAreaIds, area.id] });
                          } else {
                            setShiftData({ ...shiftData, applicableAreaIds: shiftData.applicableAreaIds.filter(id => id !== area.id) });
                          }
                        }}
                      />
                      <span className="text-xs font-medium text-gray-700 truncate">{area.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={handleSubmitShift} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-100 active:scale-95 transition-all mt-2">
                Lưu Ca làm việc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKLIST MODAL */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Thiết kế mẫu Checklist</h3>
              <button onClick={() => setShowChecklistModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-brand-600 uppercase border-b border-brand-50 pb-1">1. Thông tin chung</p>
                <div className="grid grid-cols-1 gap-3">
                  <input type="text" placeholder="Tên mẫu Checklist" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm" value={checklistData.templateName} onChange={e => setChecklistData({ ...checklistData, templateName: e.target.value })} />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={checklistData.areaId}
                      onChange={e => setChecklistData({ ...checklistData, areaId: e.target.value, shift: '' })} // Reset shift when area changes
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none"
                    >
                      <option value="">-- Chọn Khu vực --</option>
                      {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>

                    {/* SHIFT SELECTION DROPDOWN */}
                    <select
                      value={checklistData.shift}
                      onChange={e => setChecklistData({ ...checklistData, shift: e.target.value })}
                      disabled={!checklistData.areaId}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">-- Chọn Ca --</option>
                      {getAvailableShiftsForArea(checklistData.areaId).map(s => (
                        <option key={s.id} value={`${s.name} (${s.startTime})`}>
                          {s.name} ({s.startTime} - {s.endTime})
                        </option>
                      ))}
                      <option value="Khác">Khác (Nhập tay...)</option>
                    </select>
                  </div>
                  {/* Fallback for manual shift entry */}
                  {checklistData.shift === 'Khác' && (
                    <input type="text" placeholder="Nhập tên ca..." className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm" onChange={e => setChecklistData({ ...checklistData, shift: e.target.value })} />
                  )}
                </div>
              </div>

              {/* Gán nhân sự ngay khi tạo */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-brand-600 uppercase border-b border-brand-50 pb-1">2. Phân công nhiệm vụ</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">THỰC HIỆN</label>
                    <select
                      value={checklistData.assignedTo}
                      onChange={e => setChecklistData({ ...checklistData, assignedTo: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                    >
                      <option value="">-- Chọn --</option>
                      {users.filter(u => u.role === Role.STAFF || u.role === Role.MAINTENANCE).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold ml-1">KIỂM TRA</label>
                    <select
                      value={checklistData.verifiedBy}
                      onChange={e => setChecklistData({ ...checklistData, verifiedBy: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                    >
                      <option value="">-- Chọn --</option>
                      {users.filter(u => u.role === Role.ADMIN || u.role === Role.MANAGER || u.role === Role.SUPERVISOR).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Danh sách hạng mục */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-brand-600 uppercase">3. Danh sách hạng mục</p>
                  <button onClick={() => setChecklistData({ ...checklistData, items: [...checklistData.items, { text: '', isCritical: false }] })} className="text-brand-600 flex items-center gap-1 text-[10px] font-bold uppercase"><PlusCircle size={14} /> Thêm</button>
                </div>
                {checklistData.items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 mb-3 items-start animate-in slide-in-from-right-2 duration-200">
                    <div className="flex-1">
                      <input type="text" className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs" value={it.text} placeholder={`Hạng mục ${idx + 1}`} onChange={e => {
                        const n = [...checklistData.items]; n[idx].text = e.target.value; setChecklistData({ ...checklistData, items: n });
                      }} />
                      <button onClick={() => {
                        const n = [...checklistData.items]; n[idx].isCritical = !n[idx].isCritical; setChecklistData({ ...checklistData, items: n });
                      }} className={`mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${it.isCritical ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        {it.isCritical ? 'QUAN TRỌNG' : 'THÔNG THƯỜNG'}
                      </button>
                    </div>
                    {checklistData.items.length > 1 && (
                      <button onClick={() => setChecklistData({ ...checklistData, items: checklistData.items.filter((_, i) => i !== idx) })} className="text-red-300 hover:text-red-500 mt-2.5"><MinusCircle size={20} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 shrink-0">
              <button onClick={handleSubmitChecklist} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-100 active:scale-95 transition-all">Tạo Checklist mới</button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Tạo Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Khu vực *</label>
                <select
                  value={templateForm.areaId}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, areaId: e.target.value }))}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                >
                  <option value="">-- Chọn khu vực --</option>
                  {areas.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Tên template</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                  placeholder="VD: Checklist buổi sáng"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Mô tả</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none h-20 resize-none"
                  placeholder="Ghi chú thêm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Nhóm</label>
                  <input
                    type="text"
                    value={templateForm.groupTitle}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, groupTitle: e.target.value }))}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Nhãn cột</label>
                  <input
                    type="text"
                    value={templateForm.columnLabel}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, columnLabel: e.target.value }))}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Hạng mục</label>
                  <button
                    onClick={() => setTemplateForm(prev => ({ ...prev, itemTitles: [...prev.itemTitles, ''] }))}
                    className="text-[10px] bg-brand-50 text-brand-600 px-2 py-1 rounded font-bold"
                  >
                    + Thêm dòng
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {templateForm.itemTitles.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={t}
                        onChange={(e) => {
                          const next = [...templateForm.itemTitles];
                          next[idx] = e.target.value;
                          setTemplateForm(prev => ({ ...prev, itemTitles: next }));
                        }}
                        className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                        placeholder={`Hạng mục #${idx + 1}`}
                      />
                      {templateForm.itemTitles.length > 1 && (
                        <button
                          onClick={() => {
                            const next = templateForm.itemTitles.filter((_, i) => i !== idx);
                            setTemplateForm(prev => ({ ...prev, itemTitles: next }));
                          }}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSubmitTemplate}
                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-200 active:scale-95 transition-all mt-2"
              >
                Lưu template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN WORK MODAL */}
      {showAssignWorkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Gán việc mới</h3>
              <button onClick={() => setShowAssignWorkModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Template Checklist *</label>
                <select
                  value={assignWorkData.templateId}
                  onChange={e => setAssignWorkData({ ...assignWorkData, templateId: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                >
                  <option value="">-- Chọn template --</option>
                  {templates.filter((t: any) => t.is_active).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Khu vực *</label>
                <select
                  value={assignWorkData.areaId}
                  onChange={e => setAssignWorkData({ ...assignWorkData, areaId: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                >
                  <option value="">-- Chọn khu vực --</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Người thực hiện (tùy chọn)</label>
                <select
                  value={assignWorkData.assignedTo}
                  onChange={e => setAssignWorkData({ ...assignWorkData, assignedTo: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                >
                  <option value="">-- Chưa phân công --</option>
                  {users.filter(u => u.role === Role.STAFF || u.role === Role.MAINTENANCE).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Người kiểm tra (tùy chọn)</label>
                <select
                  value={assignWorkData.verifiedBy}
                  onChange={e => setAssignWorkData({ ...assignWorkData, verifiedBy: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                >
                  <option value="">-- Chưa phân công --</option>
                  {users.filter(u => u.role === Role.ADMIN || u.role === Role.MANAGER || u.role === Role.SUPERVISOR).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày thực hiện *</label>
                <input
                  type="date"
                  value={assignWorkData.date}
                  onChange={e => setAssignWorkData({ ...assignWorkData, date: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                />
              </div>

              <button
                onClick={handleSubmitAssignWork}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-2"
              >
                ✓ Tạo công việc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEMPLATE MODAL */}
      {showEditTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa Template: {editTemplateData.name}</h3>
              <button onClick={() => setShowEditTemplateModal(false)} className="text-gray-400"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tên Template *</label>
                <input
                  type="text"
                  value={editTemplateData.name}
                  onChange={e => setEditTemplateData({ ...editTemplateData, name: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                  placeholder="Tên template"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mô tả</label>
                <textarea
                  value={editTemplateData.description}
                  onChange={e => setEditTemplateData({ ...editTemplateData, description: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 outline-none"
                  rows={2}
                  placeholder="Mô tả template"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Trạng thái</label>
                <button
                  onClick={() => setEditTemplateData({ ...editTemplateData, is_active: !editTemplateData.is_active })}
                  className={`text-xs px-3 py-1 rounded-full font-bold ${editTemplateData.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {editTemplateData.is_active ? 'Đang hoạt động' : 'Đang tắt'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nhóm và hạng mục</label>
                  <div className="flex gap-2">
                    <button onClick={_handleAddGroupToTemplate} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1"><PlusCircle size={12} /> Nhóm</button>
                  </div>
                </div>

                {editTemplateData.groups.map((group, gIdx) => (
                  <div key={gIdx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={group.title}
                        onChange={e => _handleUpdateGroupTitle(gIdx, e.target.value)}
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                        placeholder={`Tên nhóm ${gIdx + 1}`}
                      />
                      <button onClick={() => _handleRemoveGroupFromTemplate(gIdx)} className="text-red-500 hover:text-red-700 text-xs"><Trash2 size={14} /></button>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => _handleUpdateItem(gIdx, iIdx, 'title', e.target.value)}
                            className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs"
                            placeholder={`Hạng mục ${iIdx + 1}`}
                          />
                          <input
                            type="text"
                            value={item.instructions || ''}
                            onChange={e => _handleUpdateItem(gIdx, iIdx, 'instructions', e.target.value)}
                            className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs"
                            placeholder="Hướng dẫn (tuỳ chọn)"
                          />
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={item.is_critical}
                              onChange={e => _handleUpdateItem(gIdx, iIdx, 'is_critical', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-red-600 font-bold">Critical</span>
                          </label>
                          <button onClick={() => _handleRemoveItemFromGroup(gIdx, iIdx)} className="text-red-500 hover:text-red-700 text-xs"><MinusCircle size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => _handleAddItemToGroup(gIdx)} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1"><PlusCircle size={12} /> Hạng mục</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Cột (phân vai/ca)</label>
                  <button onClick={_handleAddColumn} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-bold flex items-center gap-1"><PlusCircle size={12} /> Cột</button>
                </div>
                {editTemplateData.columns.map((col, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <input
                      value={col.label}
                      onChange={e => _handleUpdateColumn(idx, 'label', e.target.value)}
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      placeholder="Tên cột (ví dụ: Ca A / Giám sát)"
                    />
                    <input
                      value={col.type || 'text'}
                      onChange={e => _handleUpdateColumn(idx, 'type', e.target.value)}
                      className="w-32 p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      placeholder="Loại"
                    />
                    <input
                      value={col.options || ''}
                      onChange={e => _handleUpdateColumn(idx, 'options', e.target.value)}
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      placeholder="Options (phân tách dấu phẩy)"
                    />
                    <button onClick={() => _handleRemoveColumn(idx)} className="text-red-500 hover:text-red-700 text-xs self-start"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveEditTemplate}
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-700 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '⏳ Đang lưu...' : '✓ Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
