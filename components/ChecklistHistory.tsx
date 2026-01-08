
import React, { useState, useMemo } from 'react';
import { Checklist, ChecklistStatus, User } from '../types';
import { X, Calendar, CheckCircle2, XCircle, TrendingUp, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface ChecklistHistoryProps {
  templateName: string;
  areaId: string;
  areaName: string;
  checklists: Checklist[];
  users: User[];
  onClose: () => void;
}

export const ChecklistHistory: React.FC<ChecklistHistoryProps> = ({ 
  templateName, areaId, areaName, checklists, users, onClose 
}) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'STATS'>('LIST');

  // Filter checklists relevant to this specific template and area
  const historyData = useMemo(() => {
    return checklists
      .filter(c => c.templateName === templateName && c.area.id === areaId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [checklists, templateName, areaId]);

  // Statistics Logic
  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = now.getMonth();

    const dataLast7Days = historyData.filter(c => new Date(c.date) >= last7Days);
    const dataThisMonth = historyData.filter(c => new Date(c.date).getMonth() === thisMonth);

    const calculateRate = (data: Checklist[]) => {
      if (data.length === 0) return 0;
      const completed = data.filter(c => c.status === ChecklistStatus.COMPLETED || c.status === ChecklistStatus.REVIEWED).length;
      return Math.round((completed / data.length) * 100);
    };

    // Chart Data: Last 7 days Status
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      
      const item = historyData.find(c => c.date === dateStr);
      let statusVal = 0; // 0: Missing/Pending, 1: In Progress, 2: Completed, 3: Reviewed
      if (item) {
        if (item.status === ChecklistStatus.REVIEWED) statusVal = 3;
        else if (item.status === ChecklistStatus.COMPLETED) statusVal = 2;
        else if (item.status === ChecklistStatus.IN_PROGRESS) statusVal = 1;
      }

      return {
        name: dayLabel,
        status: statusVal,
        fullDate: dateStr,
        realStatus: item ? item.status : 'N/A'
      };
    });

    return {
      totalRuns: historyData.length,
      rate7Days: calculateRate(dataLast7Days),
      rateMonth: calculateRate(dataThisMonth),
      chartData
    };
  }, [historyData]);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <h2 className="font-bold text-lg text-gray-900 leading-tight">{templateName}</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1">
              <Filter size={12}/> Lịch sử khu vực: {areaName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm"><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setViewMode('LIST')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${viewMode === 'LIST' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            Lịch sử chi tiết
          </button>
          <button 
            onClick={() => setViewMode('STATS')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${viewMode === 'STATS' ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            Thống kê & Xu hướng
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          
          {/* VIEW: LIST */}
          {viewMode === 'LIST' && (
            <div className="space-y-3">
              {historyData.map(cl => {
                const passCount = cl.items.filter(i => i.status === 'PASS').length;
                const failCount = cl.items.filter(i => i.status === 'FAIL').length;
                
                return (
                  <div key={cl.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-bold font-mono">
                          {new Date(cl.date).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
                        </div>
                        <span className="text-xs font-medium text-gray-500">{cl.shift}</span>
                      </div>
                      <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${
                         cl.status === ChecklistStatus.REVIEWED ? 'bg-green-100 text-green-700' :
                         cl.status === ChecklistStatus.COMPLETED ? 'bg-blue-100 text-blue-700' :
                         cl.status === ChecklistStatus.IN_PROGRESS ? 'bg-orange-100 text-orange-700' :
                         'bg-gray-100 text-gray-500'
                      }`}>
                        {cl.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Người làm: <strong>{getUserName(cl.assignedTo)}</strong></span>
                      {(passCount > 0 || failCount > 0) && (
                        <div className="flex gap-2 text-[10px] font-bold">
                           <span className="text-green-600 flex items-center"><CheckCircle2 size={12} className="mr-0.5"/> {passCount}</span>
                           <span className="text-red-500 flex items-center"><XCircle size={12} className="mr-0.5"/> {failCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {historyData.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">Chưa có dữ liệu lịch sử nào.</div>
              )}
            </div>
          )}

          {/* VIEW: STATS */}
          {viewMode === 'STATS' && (
             <div className="space-y-6">
               {/* Cards */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                   <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tuần qua (7 ngày)</p>
                   <p className={`text-2xl font-black ${stats.rate7Days >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
                     {stats.rate7Days}%
                   </p>
                   <p className="text-[9px] text-gray-400">Tỷ lệ hoàn thành</p>
                 </div>
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                   <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tháng này</p>
                   <p className={`text-2xl font-black ${stats.rateMonth >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
                     {stats.rateMonth}%
                   </p>
                   <p className="text-[9px] text-gray-400">Tỷ lệ hoàn thành</p>
                 </div>
               </div>

               {/* Chart */}
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-brand-600"/> Trạng thái 7 ngày gần nhất
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 3]} />
                        <Tooltip 
                           cursor={{fill: 'transparent'}}
                           content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                               const data = payload[0].payload;
                               return (
                                 <div className="bg-gray-800 text-white text-xs p-2 rounded shadow-lg">
                                   <p className="font-bold">{data.fullDate}</p>
                                   <p>Trạng thái: {data.realStatus}</p>
                                 </div>
                               );
                             }
                             return null;
                           }}
                        />
                        <Bar dataKey="status" radius={[4, 4, 4, 4]} barSize={20}>
                          {stats.chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={
                               entry.status === 3 ? '#22c55e' : // Reviewed
                               entry.status === 2 ? '#3b82f6' : // Completed
                               entry.status === 1 ? '#f59e0b' : // In Progress
                               '#e5e7eb' // Pending/Missing
                             } />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-3 mt-4">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[9px] text-gray-500">Đã duyệt</span></div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[9px] text-gray-500">Xong</span></div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[9px] text-gray-500">Đang làm</span></div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-200"></div><span className="text-[9px] text-gray-500">Chưa làm</span></div>
                  </div>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
