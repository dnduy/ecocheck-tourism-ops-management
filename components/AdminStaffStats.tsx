import React, { useState, useEffect } from 'react';
import { statsService } from '../services/statsService';

interface StaffStats {
  total_staff: number;
  staff_with_runs: number;
  total_runs: number;
  completed_runs: number;
  pending_runs: number;
  completion_rate: number;
  staff_by_area: any[];
}

interface AdminStaffStatsProps {
  onRefresh?: () => void;
}

export const AdminStaffStats: React.FC<AdminStaffStatsProps> = () => {
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statsService.getStaffStats();
      setStaffStats(data);
    } catch (err) {
      console.error('Error loading staff stats:', err);
      setError('Không thể tải dữ liệu thống kê nhân viên');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  }

  if (error || !staffStats) {
    return <div className="text-center py-8 text-red-600">{error || 'Không thể tải dữ liệu'}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Tổng nhân viên</p>
          <p className="text-2xl font-bold">{staffStats.total_staff}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Nhân viên có công việc</p>
          <p className="text-2xl font-bold">{staffStats.staff_with_runs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Tổng công việc</p>
          <p className="text-2xl font-bold">{staffStats.total_runs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
          <p className="text-2xl font-bold text-green-600">{staffStats.completion_rate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Run breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium mb-2">Công việc hoàn thành</p>
          <p className="text-3xl font-bold text-green-600">{staffStats.completed_runs}</p>
          <p className="text-xs text-gray-600 mt-1">
            {((staffStats.completed_runs / staffStats.total_runs) * 100).toFixed(1)}% của {staffStats.total_runs} công việc
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium mb-2">Công việc chưa hoàn thành</p>
          <p className="text-3xl font-bold text-orange-600">{staffStats.pending_runs}</p>
          <p className="text-xs text-gray-600 mt-1">
            {((staffStats.pending_runs / staffStats.total_runs) * 100).toFixed(1)}% của {staffStats.total_runs} công việc
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm font-medium mb-2">Tiến độ công việc chung</p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${staffStats.completion_rate}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {staffStats.completed_runs} / {staffStats.total_runs} công việc hoàn thành
        </p>
      </div>

      {/* Refresh button */}
      <button
        onClick={loadStats}
        className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition text-sm font-medium"
      >
        Cập nhật
      </button>
    </div>
  );
};
