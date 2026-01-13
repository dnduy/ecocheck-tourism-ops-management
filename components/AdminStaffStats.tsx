import React, { useState, useEffect } from 'react';
import { statsService } from '../services/statsService';
import { ChevronDown, TrendingUp, AlertCircle, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

interface StaffStat {
  id: number;
  name: string;
  email: string;
  role: string;
  area: string;
  stats: {
    pending: number;
    in_progress: number;
    completed: number;
    needs_review: number;
    approved: number;
    rejected: number;
    total: number;
  };
  last_activity: string;
}

interface AdminStaffStatsProps {
  onRefresh?: () => void;
}

export const AdminStaffStats: React.FC<AdminStaffStatsProps> = ({ onRefresh }) => {
  const [staffStats, setStaffStats] = useState<StaffStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStaff, setExpandedStaff] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('all');

  useEffect(() => {
    loadStaffStats();
  }, []);

  const loadStaffStats = async () => {
    try {
      setLoading(true);
      const data = await statsService.getStaffStats();
      setStaffStats(data.data);
    } catch (error) {
      console.error('Error loading staff stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = selectedArea === 'all' 
    ? staffStats 
    : staffStats.filter(s => s.area === selectedArea);

  const areas = Array.from(new Set(staffStats.map(s => s.area)));

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  }

  const completionRate = (stats: StaffStat['stats']) => {
    const { pending, in_progress, completed, approved, rejected, total } = stats;
    if (total === 0) return 0;
    const doneOrReviewed = completed + approved + rejected;
    return Math.round((doneOrReviewed / total) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Filter by area */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedArea('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
            selectedArea === 'all'
              ? 'bg-brand-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tất cả
        </button>
        {areas.map(area => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              selectedArea === area
                ? 'bg-brand-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Staff List */}
      <div className="grid gap-3">
        {filteredStats.map(staff => (
          <div key={staff.id} className="border rounded-lg overflow-hidden bg-white">
            {/* Header */}
            <button
              onClick={() => setExpandedStaff(expandedStaff === staff.id ? null : staff.id)}
              className="w-full p-3 hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                <p className="text-sm text-gray-500">{staff.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-lg text-brand-600">
                    {completionRate(staff.stats)}%
                  </div>
                  <div className="text-xs text-gray-500">Hoàn thành</div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition ${expandedStaff === staff.id ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Stats Summary - Always Visible */}
            <div className="px-3 pb-3 grid grid-cols-6 gap-2">
              <StatBox label="Chưa làm" value={staff.stats.pending} color="bg-gray-100" />
              <StatBox label="Đang làm" value={staff.stats.in_progress} color="bg-blue-100" />
              <StatBox label="Đã làm" value={staff.stats.completed} color="bg-green-100" />
              <StatBox label="Chờ duyệt" value={staff.stats.needs_review} color="bg-yellow-100" />
              <StatBox label="Duyệt OK" value={staff.stats.approved} color="bg-emerald-100" />
              <StatBox label="Bị từ" value={staff.stats.rejected} color="bg-red-100" />
            </div>

            {/* Expanded Details */}
            {expandedStaff === staff.id && (
              <div className="bg-gray-50 px-3 py-3 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Khu vực:</span>
                    <span className="ml-2 font-medium">{staff.area}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vai trò:</span>
                    <span className="ml-2 font-medium">{staff.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tổng công việc:</span>
                    <span className="ml-2 font-medium">{staff.stats.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Hoạt động cuối:</span>
                    <span className="ml-2 font-medium">
                      {staff.last_activity ? new Date(staff.last_activity).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Detailed Status Breakdown */}
                <div className="space-y-1 pt-2">
                  <StatusBar label="Chưa làm (pending)" value={staff.stats.pending} total={staff.stats.total} color="bg-gray-400" />
                  <StatusBar label="Đang làm (in_progress)" value={staff.stats.in_progress} total={staff.stats.total} color="bg-blue-400" />
                  <StatusBar label="Đã làm (completed)" value={staff.stats.completed} total={staff.stats.total} color="bg-green-400" />
                  <StatusBar label="Chờ duyệt (needs_review)" value={staff.stats.needs_review} total={staff.stats.total} color="bg-yellow-400" />
                  <StatusBar label="Duyệt OK (approved)" value={staff.stats.approved} total={staff.stats.total} color="bg-emerald-400" />
                  <StatusBar label="Bị từ (rejected)" value={staff.stats.rejected} total={staff.stats.total} color="bg-red-400" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className={`${color} rounded p-1.5 text-center`}>
    <div className="font-bold text-lg">{value}</div>
    <div className="text-xs text-gray-600">{label}</div>
  </div>
);

const StatusBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({
  label,
  value,
  total,
  color,
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium w-32 text-gray-700">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{value}</span>
    </div>
  );
};
