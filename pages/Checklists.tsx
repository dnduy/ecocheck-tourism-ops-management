
import React, { useState, useEffect } from 'react';
import { Checklist, ChecklistStatus, User, Role, WorkStatus } from '../types';
import { MapPin, Clock, User as UserIcon, ClipboardList, ShieldCheck, UserCheck, Calendar, ArrowUpDown, History } from 'lucide-react';
import { ChecklistHistory } from '../components/ChecklistHistory';

interface ChecklistsProps {
  checklists: Checklist[];
  onSelectChecklist: (id: string) => void;
  currentUser: User;
  users: User[];
  onRefresh?: () => Promise<void>;
}

// Helper: Format date to Vietnamese format
const formatDateVN = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const checkDate = new Date(date);
  const checkToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const checkTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  if (checkDate.getTime() === checkToday.getTime()) {
    return `📅 Hôm nay (${dateStr})`;
  }
  if (checkDate.getTime() === checkTomorrow.getTime()) {
    return `📅 Ngày mai (${dateStr})`;
  }

  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weekDay = weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1];
  return `📅 ${weekDay}, ${dateStr}`;
};

// Helper: Group checklists by date
const groupByDate = (checklists: Checklist[]): { date: string; checklists: Checklist[] }[] => {
  const grouped = checklists.reduce((acc, cl) => {
    const date = cl.date?.split('T')[0] || cl.date || new Date().toISOString().split('T')[0];
    const existing = acc.find(g => g.date === date);
    if (existing) {
      existing.checklists.push(cl);
    } else {
      acc.push({ date, checklists: [cl] });
    }
    return acc;
  }, [] as { date: string; checklists: Checklist[] }[]);

  // Sort by date descending (newest first)
  return grouped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Helper: Count checklists by status
const countByStatus = (checklists: Checklist[]): { pending: number; inProgress: number; completed: number; reviewed: number } => {
  return {
    pending: checklists.filter(c => c.status === ChecklistStatus.PENDING).length,
    inProgress: checklists.filter(c => c.status === ChecklistStatus.IN_PROGRESS).length,
    completed: checklists.filter(c => c.status === ChecklistStatus.COMPLETED).length,
    reviewed: checklists.filter(c => c.status === ChecklistStatus.REVIEWED).length,
  };
};

export const Checklists: React.FC<ChecklistsProps> = ({ checklists, onSelectChecklist, currentUser, users, onRefresh }) => {
  const [filter, setFilter] = useState<'ALL' | 'MINE' | 'TO_VERIFY' | 'COMPLETED'>(
    currentUser.role === Role.STAFF ? 'MINE' : (currentUser.role === Role.ADMIN || currentUser.role === Role.MANAGER || currentUser.role === Role.SUPERVISOR ? 'TO_VERIFY' : 'ALL')
  );
  const [sortBy, setSortBy] = useState<'DATE' | 'STATUS' | 'AREA'>('DATE');

  // Local timezone-safe YYYY-MM-DD
  const localISODate = (d?: Date) => {
    const date = d || new Date();
    const tzOffset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - tzOffset * 60000);
    return local.toISOString().split('T')[0];
  };
  // Default to today (local timezone)
  const getDefaultDate = () => localISODate();
  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate());

  // History Modal State
  const [historyTarget, setHistoryTarget] = useState<{ templateName: string, areaId: string, areaName: string } | null>(null);

  // Refresh data when component mounts (for STAFF to see newly assigned tasks)
  useEffect(() => {
    if (onRefresh && currentUser.role === Role.STAFF) {
      onRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-update selectedDate when checklists change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (checklists.length > 0 && !selectedDate) {
      const firstDate = checklists[0].date?.split('T')[0];
      if (firstDate) setSelectedDate(firstDate);
    }
  }, [checklists]);

  const filteredData = checklists.filter(c => {
    // 1. Date Filter - compare only date part (strip time)
    // Skip date filter for MINE and TO_VERIFY tabs to show all work regardless of date
    if (filter !== 'MINE' && filter !== 'TO_VERIFY') {
      const checklistDate = c.date?.split('T')[0] || c.date;
      if (checklistDate !== selectedDate) return false;
    }

    // 2. Tab Filter
    if (filter === 'ALL') return true;
    if (filter === 'MINE') return String(c.assignedTo) === String(currentUser.id);
    // For supervisors/managers, show all completed runs awaiting verification
    if (filter === 'TO_VERIFY') {
      // Show runs that are completed and need review
      // Also show runs that verifier is assigned to current user
      const needsReview = c.workStatus === WorkStatus.NEEDS_REVIEW;
      const completed = c.status === ChecklistStatus.COMPLETED || c.workStatus === WorkStatus.COMPLETED;
      return completed || (needsReview && String(c.verifiedBy) === String(currentUser.id));
    }
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
        {/* Date Picker - Hidden when viewing "My Work" or "To Verify" since they show all dates */}
        {filter !== 'MINE' && filter !== 'TO_VERIFY' && (
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
            <Calendar size={14} className="text-brand-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-gray-700 outline-none bg-transparent"
            />
          </div>
        )}
      </div>

      {/* Filters with Counters */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide shrink-0">
        {(() => {
          const allCount = checklists.length;
          const mineCount = checklists.filter(c => String(c.assignedTo) === String(currentUser.id)).length;
          const toVerifyCount = checklists.filter(c => {
            const needsReview = c.workStatus === WorkStatus.NEEDS_REVIEW;
            const completed = c.status === ChecklistStatus.COMPLETED || c.workStatus === WorkStatus.COMPLETED;
            return completed || (needsReview && String(c.verifiedBy) === String(currentUser.id));
          }).length;
          const completedCount = checklists.filter(c => c.status === ChecklistStatus.REVIEWED).length;

          return [
            { id: 'ALL', label: 'Tất cả', count: allCount },
            { id: 'MINE', label: 'Việc của tôi', count: mineCount },
            { id: 'TO_VERIFY', label: 'Cần duyệt', count: toVerifyCount },
            { id: 'COMPLETED', label: 'Lịch sử', count: completedCount }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border flex items-center gap-2 ${filter === f.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 border-brand-600' : 'bg-white text-gray-500 border-gray-100 hover:border-brand-200'
                }`}
            >
              {f.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${filter === f.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                {f.count}
              </span>
            </button>
          ));
        })()}
      </div>

      {/* Sorting & Count */}
      <div className="flex justify-between items-center px-1 mb-3 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          {filter === 'MINE' && (() => {
            const today = localISODate();
            const todayCount = checklists.filter(c => String(c.assignedTo) === String(currentUser.id) && c.date?.split('T')[0] === today).length;
            return `Hôm nay: ${todayCount} | Tổng: ${sortedData.length}`;
          })()}
          {filter !== 'MINE' && `Hiển thị ${sortedData.length} nhiệm vụ`}
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
        {/* Daily Stats for MINE filter */}
        {filter === 'MINE' && (() => {
          const today = localISODate();
          const todayChecklists = filteredData.filter(c => c.date?.split('T')[0] === today);
          const stats = countByStatus(todayChecklists);

          return todayChecklists.length > 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-base text-gray-900">📅 Công việc hôm nay</h2>
                <div className="text-2xl font-bold text-blue-600">{todayChecklists.length}</div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="bg-white/70 p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-red-500">{stats.pending}</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">Chưa làm</div>
                </div>
                <div className="bg-white/70 p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-500">{stats.inProgress}</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">Đang làm</div>
                </div>
                <div className="bg-white/70 p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-orange-500">{stats.completed}</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">Chờ duyệt</div>
                </div>
                <div className="bg-white/70 p-2 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-500">{stats.reviewed}</div>
                  <div className="text-[9px] text-gray-600 mt-0.5">Xong</div>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {sortedData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <ClipboardList size={48} className="mx-auto text-gray-100 mb-3" />
            <p className="text-sm text-gray-400 font-medium">Không có Checklist nào trong bộ lọc này.</p>
          </div>
        ) : (
          // Group by date and render
          groupByDate(sortedData).map(({ date, checklists: dateChecklists }) => {
            const stats = countByStatus(dateChecklists);

            return (
              <div key={date}>
                {/* Sticky Date Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl sticky top-0 z-5 border border-gray-200 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {formatDateVN(date)}
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs">
                        <span className={stats.pending > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>❌ {stats.pending} chưa làm</span>
                        <span className={stats.inProgress > 0 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>🔄 {stats.inProgress} đang làm</span>
                        <span className={stats.completed > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'}>⏳ {stats.completed} chờ duyệt</span>
                        <span className={stats.reviewed > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}>✅ {stats.reviewed} xong</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-brand-600">{dateChecklists.length}</div>
                      <div className="text-[9px] text-gray-500">công việc</div>
                    </div>
                  </div>
                </div>

                {/* Checklists for this date */}
                {/* Checklists for this date */}
                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 mb-4">
                  {dateChecklists.map((cl) => {
                    const executor = getUser(cl.assignedTo);
                    const verifier = getUser(cl.verifiedBy);
                    const isPending = cl.status === ChecklistStatus.PENDING;

                    // Special state for Verifiers seeing pending items
                    const isWaitingForStaff = filter === 'TO_VERIFY' && (cl.status === ChecklistStatus.PENDING || cl.status === ChecklistStatus.IN_PROGRESS);

                    return (
                      <div
                        key={cl.id}
                        className={`bg-white p-5 rounded-3xl shadow-sm border transition-all hover:shadow-md ${isPending
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
                              <div className="flex items-center text-[10px] text-gray-400"><MapPin size={10} className="mr-1" />{cl.area.name}</div>
                              <div className="flex items-center text-[10px] text-gray-400"><Clock size={10} className="mr-1" />{cl.shift}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1.5">
                              {isWaitingForStaff ? (
                                <span className="text-[8px] font-bold px-2 py-1 rounded-lg uppercase whitespace-nowrap tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                  Chờ nhân viên
                                </span>
                              ) : (
                                <span className={`text-[8px] font-bold px-2 py-1 rounded-lg uppercase whitespace-nowrap tracking-wider ${cl.status === ChecklistStatus.PENDING ? 'bg-gray-100 text-gray-400' :
                                    cl.status === ChecklistStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' :
                                      cl.status === ChecklistStatus.COMPLETED ? 'bg-orange-50 text-orange-600 animate-pulse' :
                                        'bg-green-50 text-green-600'
                                  }`}>
                                  {cl.status === ChecklistStatus.PENDING ? 'Chưa bắt đầu' :
                                    cl.status === ChecklistStatus.IN_PROGRESS ? 'Đang thực hiện' :
                                      cl.status === ChecklistStatus.COMPLETED ? 'Chờ kiểm tra' : 'Đã duyệt'}
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
                              <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400" title="Chưa gán người làm"><UserIcon size={12} /></div>
                            )}
                            {verifier ? (
                              <img src={verifier.avatar} className={`w-8 h-8 rounded-full border-2 border-white bg-purple-50 object-cover ${isPending ? 'opacity-50' : ''}`} title={`Kiểm tra: ${verifier.name}`} />
                            ) : (
                              <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400" title="Chưa gán người duyệt"><ShieldCheck size={12} /></div>
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
                  })}
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
