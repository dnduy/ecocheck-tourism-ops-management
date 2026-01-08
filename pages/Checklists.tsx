
import React, { useState } from 'react';
import { Checklist, ChecklistStatus, User, Role } from '../types';
import { Search, MapPin, Clock, User as UserIcon, ClipboardList, ShieldCheck, UserCheck, Calendar, ArrowUpDown, History, AlertCircle } from 'lucide-react';
import { ChecklistHistory } from '../components/ChecklistHistory';

interface ChecklistsProps {
  checklists: Checklist[];
  onSelectChecklist: (id: string) => void;
  currentUser: User;
  users: User[];
}

export const Checklists: React.FC<ChecklistsProps> = ({ checklists, onSelectChecklist, currentUser, users }) => {
  const [filter, setFilter] = useState<'ALL' | 'MINE' | 'TO_VERIFY' | 'COMPLETED'>(
    currentUser.role === Role.STAFF ? 'MINE' : (currentUser.role === Role.MANAGER || currentUser.role === Role.SUPERVISOR ? 'TO_VERIFY' : 'ALL')
  );
  const [sortBy, setSortBy] = useState<'DATE' | 'STATUS' | 'AREA'>('DATE');
  
  // Date Filter State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // History Modal State
  const [historyTarget, setHistoryTarget] = useState<{templateName: string, areaId: string, areaName: string} | null>(null);

  const filteredData = checklists.filter(c => {
    // 1. Date Filter
    if (c.date !== selectedDate) return false;

    // 2. Tab Filter
    if (filter === 'ALL') return true;
    if (filter === 'MINE') return c.assignedTo === currentUser.id;
    // Updated: Verifiers can see all checklists assigned to them, even if not yet COMPLETED (to track progress)
    if (filter === 'TO_VERIFY') return c.verifiedBy === currentUser.id; 
    if (filter === 'COMPLETED') return c.status === ChecklistStatus.REVIEWED;
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'DATE') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'STATUS') {
      const order = {
        [ChecklistStatus.PENDING]: 0,
        [ChecklistStatus.IN_PROGRESS]: 1,
        [ChecklistStatus.COMPLETED]: 2,
        [ChecklistStatus.REVIEWED]: 3
      };
      return (order[a.status] ?? 99) - (order[b.status] ?? 99);
    }
    if (sortBy === 'AREA') {
      return a.area.name.localeCompare(b.area.name);
    }
    return 0;
  });

  const getUser = (id?: string) => users.find(u => u.id === id);

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nhiệm vụ</h1>
        {/* Date Picker */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
           <Calendar size={14} className="text-brand-600" />
           <input 
             type="date" 
             value={selectedDate} 
             onChange={(e) => setSelectedDate(e.target.value)}
             className="text-xs font-bold text-gray-700 outline-none bg-transparent"
           />
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide shrink-0">
        {[
          { id: 'ALL', label: 'Tất cả' }, 
          { id: 'MINE', label: 'Việc của tôi' }, 
          { id: 'TO_VERIFY', label: 'Cần duyệt' }, 
          { id: 'COMPLETED', label: 'Lịch sử' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
              filter === f.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 border-brand-600' : 'bg-white text-gray-500 border-gray-100 hover:border-brand-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sorting & Count */}
      <div className="flex justify-between items-center px-1 mb-3 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          Hiển thị {sortedData.length} nhiệm vụ
        </span>
        
        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
           <ArrowUpDown size={14} className="text-brand-500" />
           <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">Sắp xếp:</span>
           <select 
             value={sortBy}
             onChange={(e) => setSortBy(e.target.value as any)}
             className="bg-transparent text-[10px] font-bold text-gray-600 outline-none cursor-pointer"
           >
             <option value="DATE">Mới nhất</option>
             <option value="STATUS">Trạng thái</option>
             <option value="AREA">Tên khu vực</option>
           </select>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {sortedData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <ClipboardList size={48} className="mx-auto text-gray-100 mb-3" />
            <p className="text-sm text-gray-400 font-medium">Không có Checklist nào trong bộ lọc này.</p>
          </div>
        ) : (
          sortedData.map((cl) => {
            const executor = getUser(cl.assignedTo);
            const verifier = getUser(cl.verifiedBy);
            const isPending = cl.status === ChecklistStatus.PENDING;
            
            // Special state for Verifiers seeing pending items
            const isWaitingForStaff = filter === 'TO_VERIFY' && (cl.status === 'PENDING' || cl.status === 'IN_PROGRESS');

            return (
              <div 
                key={cl.id} 
                className={`bg-white p-5 rounded-3xl shadow-sm border transition-all hover:shadow-md ${
                  isPending 
                    ? 'opacity-75 grayscale-[0.1] border-gray-100' 
                    : 'border-gray-50 hover:border-brand-50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div 
                    className="flex-1 mr-3 cursor-pointer"
                    onClick={() => onSelectChecklist(cl.id)}
                  >
                    <h3 className={`font-bold text-gray-900 leading-tight mb-1 ${isPending ? 'text-gray-600' : ''}`}>
                      {cl.templateName}
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center text-[10px] text-gray-400"><MapPin size={10} className="mr-1"/>{cl.area.name}</div>
                      <div className="flex items-center text-[10px] text-gray-400"><Clock size={10} className="mr-1"/>{cl.shift}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className="flex items-center gap-1.5">
                      {isWaitingForStaff ? (
                        <span className="text-[8px] font-bold px-2 py-1 rounded-lg uppercase whitespace-nowrap tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                          Chờ nhân viên
                        </span>
                      ) : (
                        <span className={`text-[8px] font-bold px-2 py-1 rounded-lg uppercase whitespace-nowrap tracking-wider ${
                          cl.status === ChecklistStatus.PENDING ? 'bg-gray-100 text-gray-400' :
                          cl.status === ChecklistStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' :
                          cl.status === ChecklistStatus.COMPLETED ? 'bg-orange-50 text-orange-600 animate-pulse' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {cl.status === 'PENDING' ? 'Chưa bắt đầu' : 
                          cl.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 
                          cl.status === 'COMPLETED' ? 'Chờ kiểm tra' : 'Đã duyệt'}
                        </span>
                      )}
                    </div>
                    {/* History Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setHistoryTarget({ templateName: cl.templateName, areaId: cl.area.id, areaName: cl.area.name });
                      }}
                      className="p-1.5 bg-gray-50 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                      title="Xem lịch sử & thống kê"
                    >
                      <History size={16} />
                    </button>
                  </div>
                </div>
                
                <div 
                  className="flex items-center justify-between pt-4 border-t border-gray-50 cursor-pointer"
                  onClick={() => onSelectChecklist(cl.id)}
                >
                  <div className="flex -space-x-2">
                    {executor ? (
                      <img src={executor.avatar} className={`w-8 h-8 rounded-full border-2 border-white bg-brand-50 object-cover ${isPending ? 'opacity-50' : ''}`} title={`Thực hiện: ${executor.name}`} />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400" title="Chưa gán người làm"><UserIcon size={12}/></div>
                    )}
                    {verifier ? (
                      <img src={verifier.avatar} className={`w-8 h-8 rounded-full border-2 border-white bg-purple-50 object-cover ${isPending ? 'opacity-50' : ''}`} title={`Kiểm tra: ${verifier.name}`} />
                    ) : (
                       <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400" title="Chưa gán người duyệt"><ShieldCheck size={12}/></div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400">
                      <UserCheck size={12} className={executor ? "text-brand-300" : "text-gray-300"} /> 
                      {executor?.name || <span className="text-red-300 italic">Chưa gán</span>}
                    </div>
                    {verifier && (
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-purple-400 mt-0.5">
                        <ShieldCheck size={12} /> {verifier.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* HISTORY MODAL */}
      {historyTarget && (
        <ChecklistHistory 
          templateName={historyTarget.templateName}
          areaId={historyTarget.areaId}
          areaName={historyTarget.areaName}
          checklists={checklists} // Pass ALL checklists to let component filter history
          users={users}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
};
