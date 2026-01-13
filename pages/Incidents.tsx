
import React, { useState, useMemo, useRef } from 'react';
import { Incident, IncidentStatus, IncidentPriority, User, Area } from '../types';
import { Bot, ChevronDown, ChevronRight, CheckCircle, Hammer, Plus, X, AlertTriangle, User as UserIcon, Wrench, Zap, Droplets, Truck, Armchair, Flower2 } from 'lucide-react';
import { analyzeIncident } from '../services/geminiService';
import { sanitizeInput } from '../services/validation';

interface IncidentsProps {
  incidents: Incident[];
  currentUser: User;
  users?: User[];
  areas?: Area[];
  onUpdateStatus: (id: string, status: IncidentStatus, resolutionNote?: string) => void;
  onCreateIncident: (data: { title: string; description: string; area: string; priority: IncidentPriority; reportedBy: string }) => void;
  onAssignIncident?: (id: string, userId: number) => void;
}

export const Incidents: React.FC<IncidentsProps> = ({ incidents, currentUser, users = [], areas = [], onUpdateStatus, onCreateIncident, onAssignIncident }) => {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<Record<string, string>>({});
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus.OPEN | IncidentStatus.IN_PROGRESS | IncidentStatus.RESOLVED>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | IncidentPriority>('all');
  const [areaFilter, setAreaFilter] = useState<string>('');

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    area: '',
    priority: IncidentPriority.MEDIUM,
    reportedBy: '',
    description: ''
  });

  // --- HELPER: Detect Category based on text ---
  const detectCategory = (incident: Incident) => {
    const text = (incident.title + ' ' + incident.description).toLowerCase();
    
    if (text.includes('máy lạnh') || text.includes('điều hòa') || text.includes('quạt') || text.includes('nóng lạnh') || text.includes('thông gió')) return 'Điện lạnh (HVAC)';
    if (text.includes('nước') || text.includes('vòi') || text.includes('ống') || text.includes('bồn') || text.includes('lavabo') || text.includes('rò rỉ')) return 'Cấp thoát nước';
    if (text.includes('đèn') || text.includes('điện') || text.includes('dây') || text.includes('công tắc') || text.includes('ổ cắm') || text.includes('mất điện')) return 'Điện dân dụng';
    if (text.includes('xe') || text.includes('lốp') || text.includes('phanh') || text.includes('động cơ') || text.includes('xăng') || text.includes('điện xe')) return 'Phương tiện';
    if (text.includes('bàn') || text.includes('ghế') || text.includes('giường') || text.includes('cửa') || text.includes('tủ') || text.includes('rèm') || text.includes('sàn') || text.includes('tường')) return 'Nội thất & CSVC';
    if (text.includes('cây') || text.includes('cỏ') || text.includes('vườn') || text.includes('rác') || text.includes('bể bơi') || text.includes('hồ')) return 'Cảnh quan & Vệ sinh';
    if (text.includes('wifi') || text.includes('mạng') || text.includes('camera') || text.includes('máy tính')) return 'CNTT & Mạng';
    
    return 'Khác';
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Điện lạnh (HVAC)': return <Bot size={18} className="text-blue-500" />;
      case 'Cấp thoát nước': return <Droplets size={18} className="text-cyan-500" />;
      case 'Điện dân dụng': return <Zap size={18} className="text-yellow-500" />;
      case 'Phương tiện': return <Truck size={18} className="text-orange-500" />;
      case 'Nội thất & CSVC': return <Armchair size={18} className="text-amber-700" />;
      case 'Cảnh quan & Vệ sinh': return <Flower2 size={18} className="text-green-500" />;
      default: return <Wrench size={18} className="text-gray-500" />;
    }
  };

  // --- FILTERING & GROUPING LOGIC ---
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const byStatus = statusFilter === 'all' ? true : inc.status === statusFilter;
      const byPriority = priorityFilter === 'all' ? true : (inc as any).priority === priorityFilter;
      const byArea = areaFilter ? String(inc.area || '').toLowerCase().includes(areaFilter.toLowerCase()) : true;
      return byStatus && byPriority && byArea;
    });
  }, [incidents, statusFilter, priorityFilter, areaFilter]);

  const groupedIncidents = useMemo(() => {
    const groups: Record<string, Incident[]> = {};
    
    // Sort incidents to handle "Other" last visually if needed, but here just grouping
    filteredIncidents.forEach(inc => {
      const cat = detectCategory(inc);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(inc);
    });

    return groups;
  }, [filteredIncidents]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Initialize expanded state once for categories with open items
  const expandedInitRef = useRef(false);
  React.useEffect(() => {
    if (expandedInitRef.current) return;
    const initialExpanded: Record<string, boolean> = {};
    Object.entries(groupedIncidents).forEach(([cat, items]: [string, Incident[]]) => {
      if (items.some(i => i.status !== IncidentStatus.RESOLVED)) {
        initialExpanded[cat] = true;
      }
    });
    setExpandedCategories(initialExpanded);
    expandedInitRef.current = true;
  }, [groupedIncidents]);


  const handleOpenCreateModal = () => {
    setFormData({
      title: '',
      area: '',
      priority: IncidentPriority.MEDIUM,
      reportedBy: currentUser.name,
      description: ''
    });
    setShowCreateModal(true);
  };

  const handleSubmitCreate = () => {
    const cleanTitle = sanitizeInput(formData.title);
    const cleanDescription = sanitizeInput(formData.description);
    
    if (!cleanTitle || cleanTitle.length < 3) {
      alert("Vui lòng nhập tiêu đề (ít nhất 3 ký tự)");
      return;
    }
    if (!formData.area) {
      alert("Vui lòng chọn khu vực");
      return;
    }
    onCreateIncident({
      ...formData,
      title: cleanTitle,
      description: cleanDescription
    });
    setShowCreateModal(false);
  };

  const handleAiAnalyze = async (incident: Incident) => {
    if (aiAdvice[incident.id]) return; // Already analyzed
    
    setAiLoading(true);
    const areaName = typeof incident.area === 'string' ? incident.area : incident.area.name;
    const advice = await analyzeIncident(incident.title, incident.description, areaName);
    setAiAdvice(prev => ({ ...prev, [incident.id]: advice }));
    setAiLoading(false);
  };

  const getPriorityColor = (p: IncidentPriority) => {
    switch (p) {
      case IncidentPriority.CRITICAL: return 'bg-red-100 text-red-700 border-red-200';
      case IncidentPriority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
      case IncidentPriority.MEDIUM: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const statusLabels: Record<IncidentStatus, string> = {
    [IncidentStatus.OPEN]: 'Đang mở',
    [IncidentStatus.IN_PROGRESS]: 'Đang xử lý',
    [IncidentStatus.RESOLVED]: 'Đã xong'
  };

  const getStatusBadgeClass = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.OPEN:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case IncidentStatus.IN_PROGRESS:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case IncidentStatus.RESOLVED:
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const openDetail = (inc: Incident) => {
    setDetailIncident(inc);
    setResolutionNote((inc as any).resolution_note || '');
    setAssignedUserId((inc as any).assigned_to || null);
  };

  const closeDetail = () => {
    setDetailIncident(null);
    setResolutionNote('');
    setAssignedUserId(null);
  };

  const handleResolve = (inc: Incident) => {
    onUpdateStatus(String(inc.id), IncidentStatus.RESOLVED, resolutionNote || (inc as any).resolution_note);
    closeDetail();
  };

  const handleMarkInProgress = (inc: Incident) => {
    onUpdateStatus(String(inc.id), IncidentStatus.IN_PROGRESS);
    closeDetail();
  };

  const handleAssignUser = () => {
    if (detailIncident && assignedUserId && onAssignIncident) {
      onAssignIncident(String(detailIncident.id), assignedUserId);
      closeDetail();
    }
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý sự cố</h1>
        <button 
          onClick={handleOpenCreateModal}
          className="bg-red-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold shadow-lg shadow-red-100 active:scale-95 transition-transform"
        >
          <Plus size={16} className="mr-1" /> Tạo sự cố
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="p-2 bg-white border border-gray-200 rounded-xl text-[12px]"
        >
          <option value="all">Trạng thái: tất cả</option>
          <option value={IncidentStatus.OPEN}>Đang mở</option>
          <option value={IncidentStatus.IN_PROGRESS}>Đang xử lý</option>
          <option value={IncidentStatus.RESOLVED}>Đã xong</option>
        </select>
        <select 
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="p-2 bg-white border border-gray-200 rounded-xl text-[12px]"
        >
          <option value="all">Ưu tiên: tất cả</option>
          {Object.values(IncidentPriority).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input 
          type="text"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="p-2 bg-white border border-gray-200 rounded-xl text-[12px]"
          placeholder="Lọc theo khu vực"
        />
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {filteredIncidents.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
             <AlertTriangle size={48} className="mx-auto text-gray-100 mb-3" />
             <p className="text-sm text-gray-400 font-medium">Không có sự cố nào đang mở</p>
           </div>
        ) : (
          Object.entries(groupedIncidents).map(([category, items]: [string, Incident[]]) => {
            const isCategoryExpanded = !!expandedCategories[category];
            const openCount = items.filter(i => i.status !== IncidentStatus.RESOLVED).length;

            return (
              <div key={category} className="mb-4">
                {/* Category Header */}
                <button 
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all mb-2 ${
                    isCategoryExpanded 
                      ? 'bg-white border-brand-200 shadow-sm' 
                      : 'bg-white border-gray-100 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCategoryExpanded ? 'bg-brand-50' : 'bg-gray-50'}`}>
                       {getCategoryIcon(category)}
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-gray-800">{category}</h3>
                      <p className="text-[10px] text-gray-500 font-medium">{items.length} sự cố {openCount > 0 && <span className="text-orange-500">({openCount} đang mở)</span>}</p>
                    </div>
                  </div>
                  {isCategoryExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                </button>

                {/* List of Incidents in Category */}
                {isCategoryExpanded && (
                  <div className="space-y-3 pl-2 animate-in slide-in-from-top-2 duration-200">
                    {items.map((incident) => {
                      const isExpanded = selectedIncident === incident.id;
                      const advice = aiAdvice[incident.id];

                      return (
                        <div key={incident.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ml-2 relative">
                          {/* Priority Stripe */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            incident.priority === IncidentPriority.CRITICAL ? 'bg-red-500' :
                            incident.priority === IncidentPriority.HIGH ? 'bg-orange-500' :
                            incident.priority === IncidentPriority.MEDIUM ? 'bg-yellow-400' : 'bg-gray-300'
                          }`}></div>

                          <div 
                            className="p-3 pl-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setSelectedIncident(isExpanded ? null : incident.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {incident.status === IncidentStatus.RESOLVED && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                                      <CheckCircle size={10} /> ĐÃ XONG
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(incident.priority)}`}>
                                    {incident.priority}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{new Date(incident.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className={`font-bold text-sm ${incident.status === IncidentStatus.RESOLVED ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{incident.title}</h3>
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{incident.area}</p>
                              </div>
                              <ChevronDown size={16} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50 pt-3">
                              <p className="text-xs text-gray-700 mb-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">{incident.description}</p>
                              <div className="text-[10px] text-gray-400 mb-3 font-medium flex items-center gap-1">
                                 <UserIcon size={12}/> Người báo: {incident.reportedBy}
                              </div>
                              
                              {/* Action Bar */}
                              <div className="flex gap-2 mb-3">
                                {incident.status !== IncidentStatus.RESOLVED && (
                                  <button 
                                    onClick={() => onUpdateStatus(incident.id, IncidentStatus.RESOLVED)}
                                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center justify-center hover:bg-green-700 shadow-sm"
                                  >
                                    <CheckCircle size={14} className="mr-1.5" />
                                    Hoàn thành
                                  </button>
                                )}
                                 {incident.status === IncidentStatus.OPEN && (
                                  <button 
                                    onClick={() => onUpdateStatus(incident.id, IncidentStatus.IN_PROGRESS)}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center hover:bg-blue-700 shadow-sm"
                                  >
                                    <Hammer size={14} className="mr-1.5" />
                                    Nhận việc
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openDetail(incident); }}
                                  className="flex-1 py-2 bg-white text-gray-700 rounded-lg text-xs font-bold flex items-center justify-center border border-gray-200 hover:border-brand-200"
                                >
                                  Xem chi tiết
                                </button>
                              </div>

                              {/* AI Section */}
                              <div className="bg-white rounded-lg p-3 border border-purple-100 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs font-bold text-purple-800 flex items-center">
                                    <Bot size={14} className="mr-1.5" />
                                    Trợ lý Kỹ thuật AI
                                  </h4>
                                  {!advice && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleAiAnalyze(incident); }}
                                      disabled={aiLoading}
                                      className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50 font-bold"
                                    >
                                      {aiLoading ? 'Đang phân tích...' : 'Gợi ý xử lý'}
                                    </button>
                                  )}
                                </div>
                                
                                {advice ? (
                                   <div className="text-xs text-gray-600 whitespace-pre-line leading-relaxed bg-purple-50 p-2 rounded">
                                     {advice}
                                   </div>
                                ) : (
                                  <p className="text-[10px] text-gray-400 italic">
                                    Nhấn nút để AI phân tích nguyên nhân và đề xuất giải pháp.
                                  </p>
                                )}
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {detailIncident && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={closeDetail}>
          <div 
            className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-2xl shadow-2xl border border-gray-100 p-5 md:p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPriorityColor(detailIncident.priority)}`}>
                    {detailIncident.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(detailIncident.status)}`}>
                    {statusLabels[detailIncident.status]}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{detailIncident.title}</h3>
                <p className="text-xs text-gray-500">Khu vực: {detailIncident.area}</p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-gray-500 text-xs mb-1 font-semibold">Mô tả</p>
                <p>{detailIncident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-[11px] text-gray-500 mb-1 font-semibold">Người báo</p>
                  <p className="font-semibold text-gray-800 flex items-center gap-1"><UserIcon size={12}/> {detailIncident.reportedBy}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-[11px] text-gray-500 mb-1 font-semibold">Thời gian</p>
                  <p className="font-semibold text-gray-800">{detailIncident.createdAt}</p>
                </div>
              </div>

              {/* Assign User Section */}
              {users.length > 0 && onAssignIncident && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-[11px] text-blue-600 mb-2 font-semibold flex items-center gap-1">
                    <UserIcon size={12}/> Gán người xử lý
                  </p>
                  <div className="flex gap-2">
                    <select 
                      value={assignedUserId || ''}
                      onChange={(e) => setAssignedUserId(Number(e.target.value))}
                      className="flex-1 border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Chọn người --</option>
                      {users.filter(u => u.role === 'maintenance' || u.role === 'staff').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignUser}
                      disabled={!assignedUserId}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Gán
                    </button>
                  </div>
                  {(detailIncident as any).assigned_to && (
                    <p className="text-[10px] text-blue-500 mt-1">
                      Đã gán cho: {users.find(u => String(u.id) === String((detailIncident as any).assigned_to))?.name || 'User #' + (detailIncident as any).assigned_to}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[11px] text-gray-500 mb-2 font-semibold flex items-center gap-1"><CheckCircle size={12}/> Ghi chú hoàn thành</p>
                <textarea 
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-200"
                  rows={3}
                  placeholder="Chi tiết cách xử lý sự cố (nếu có)"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
                {detailIncident.status === IncidentStatus.RESOLVED && (detailIncident as any).resolution_note && (
                  <p className="text-[11px] text-gray-500 mt-1">Đã lưu trước đó: {(detailIncident as any).resolution_note}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button 
                onClick={() => handleMarkInProgress(detailIncident)}
                disabled={detailIncident.status === IncidentStatus.RESOLVED}
                className="py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Hammer size={16}/> Nhận xử lý
              </button>
              <button 
                onClick={() => handleResolve(detailIncident)}
                className="py-3 bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-700"
              >
                <CheckCircle size={16}/> Đánh dấu hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Báo cáo sự cố mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400"><X size={24}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Tiêu đề sự cố</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-red-100 outline-none"
                  placeholder="VD: Hỏng vòi nước phòng 101"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Khu vực</label>
                   {areas.length > 0 ? (
                     <select
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-red-100 outline-none"
                     >
                       <option value="">-- Chọn khu vực --</option>
                       {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                     </select>
                   ) : (
                     <input 
                      type="text" 
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-red-100 outline-none"
                      placeholder="Nhập tên khu vực"
                    />
                   )}
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Mức độ ưu tiên</label>
                   <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as IncidentPriority})}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-red-100 outline-none"
                   >
                     {Object.values(IncidentPriority).map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Người báo cáo</label>
                <input 
                  type="text" 
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({...formData, reportedBy: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-red-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">Mô tả chi tiết</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-red-100 outline-none h-24 resize-none"
                  placeholder="Mô tả chi tiết tình trạng..."
                />
              </div>

              <button 
                onClick={handleSubmitCreate}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-100 active:scale-95 transition-all mt-2"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
