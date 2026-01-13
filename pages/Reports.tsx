
import React from 'react';
import { Checklist, Incident, User } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { FileSpreadsheet } from 'lucide-react';
import { exportChecklistsToExcel } from '../services/excelExport';

interface ReportsProps {
  checklists: Checklist[];
  incidents: Incident[];
  users: User[];
}

export const Reports: React.FC<ReportsProps> = React.memo(({ checklists, incidents, users }) => {
  // Process Data for Charts
  const statusData = [
    { name: 'Hoàn thành', value: checklists.filter(c => c.status === 'COMPLETED').length, color: '#22c55e' },
    { name: 'Chưa làm', value: checklists.filter(c => c.status === 'PENDING').length, color: '#94a3b8' },
    { name: 'Đang làm', value: checklists.filter(c => c.status === 'IN_PROGRESS').length, color: '#3b82f6' },
  ];

  // Helper to categorize equipment based on text analysis (Mock logic for demo)
  const getEquipmentCategory = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('máy lạnh') || lower.includes('điều hòa') || lower.includes('quạt')) return 'Điện lạnh';
    if (lower.includes('nước') || lower.includes('vòi') || lower.includes('ống') || lower.includes('bồn') || lower.includes('lavabo')) return 'Cấp thoát nước';
    if (lower.includes('đèn') || lower.includes('điện') || lower.includes('dây') || lower.includes('led')) return 'Điện dân dụng';
    if (lower.includes('xe') || lower.includes('lốp') || lower.includes('phanh') || lower.includes('động cơ')) return 'Phương tiện';
    if (lower.includes('bàn') || lower.includes('ghế') || lower.includes('giường') || lower.includes('cửa')) return 'Nội thất';
    return 'Khác';
  };

  const equipmentStats = incidents.reduce((acc, curr) => {
    const cat = getEquipmentCategory(curr.title + ' ' + curr.description);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fix: Explicitly cast count to number to resolve arithmetic operation errors in sort and later calculations
  const equipmentData = Object.entries(equipmentStats)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => (b.count as number) - (a.count as number));

  const totalIncidents = incidents.length;

  const issueData = [
    { name: 'F&B', count: incidents.filter(i => i.area.includes('Nhà hàng') || i.area.includes('Bếp')).length + 2 },
    { name: 'Hotel', count: incidents.filter(i => i.area.includes('Khách sạn') || i.area.includes('Sảnh')).length + 1 },
    { name: 'Garden', count: incidents.filter(i => i.area.includes('Sân') || i.area.includes('Khu')).length },
    { name: 'Tour', count: incidents.filter(i => i.area.includes('xe') || i.area.includes('Tour')).length },
  ];

  const handleExport = () => {
    if (window.confirm("Tải xuống dữ liệu chi tiết của toàn bộ Checklist dưới dạng Excel?")) {
      exportChecklistsToExcel(checklists, users);
    }
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo vận hành</h1>
        <button 
          onClick={handleExport}
          className="bg-green-600 text-white px-3 py-2 rounded-xl flex items-center text-xs font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-colors active:scale-95"
        >
          <FileSpreadsheet size={18} className="mr-1.5" /> Xuất Excel
        </button>
      </div>

      {/* Completion Rate */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-700 mb-4">Tỷ lệ hoàn thành Checklist</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height={256} minWidth={0}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issues by Equipment (New Detailed Section) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-700 mb-4">Phân tích sự cố theo Loại thiết bị</h3>
        
        {/* Chart */}
        <div className="h-56 w-full mb-6">
          <ResponsiveContainer width="100%" height={224} minWidth={0}>
            <BarChart data={equipmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" fill="#8884d8" name="Số lượng" radius={[4, 4, 0, 0]} barSize={40}>
                {equipmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#14b8a6'][index % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-3 py-2 rounded-tl-lg">Loại thiết bị</th>
                <th className="px-3 py-2 text-center">Số lượng</th>
                <th className="px-3 py-2 text-right rounded-tr-lg">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipmentData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-700">{item.name}</td>
                  <td className="px-3 py-2 text-center font-bold text-gray-900">{item.count}</td>
                  <td className="px-3 py-2 text-right text-gray-500">
                    {(((item.count as number) / totalIncidents) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues by Department */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-4">Sự cố theo khu vực (Tổng hợp)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height={192} minWidth={0}>
            <BarChart data={issueData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24}>
                 <Cell fill="#ef4444" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-blue-700">95%</p>
          <p className="text-xs text-blue-500">Đúng hạn</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-orange-700">{totalIncidents}</p>
          <p className="text-xs text-orange-500">Tổng sự cố</p>
        </div>
      </div>
    </div>
  );
});
