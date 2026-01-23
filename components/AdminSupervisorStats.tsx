import React, { useState, useEffect } from 'react';
import { statsService } from '../services/statsService';

interface SupervisorStats {
  total_supervisors: number;
  supervisors_with_signoffs: number;
  total_signoffs: number;
  average_signoff_time: string;
  signoffs_by_supervisor: Array<{
    id: number;
    name: string;
    total_signoffs: number;
  }>;
  quality_metrics: {
    total_runs: number;
    completed_runs: number;
    signed_runs: number;
    unsigned_rate: number;
  };
}

interface AdminSupervisorStatsProps {
  onRefresh?: () => void;
}

export const AdminSupervisorStats: React.FC<AdminSupervisorStatsProps> = () => {
  const [supervisorStats, setSupervisorStats] = useState<SupervisorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statsService.getSupervisorStats();
      setSupervisorStats(data);
    } catch (err) {
      console.error('Error loading supervisor stats:', err);
      setError('Không thể tải dữ liệu thống kê giám sát');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  }

  if (error || !supervisorStats) {
    return <div className="text-center py-8 text-red-600">{error || 'Không thể tải dữ liệu'}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Tổng giám sát</p>
          <p className="text-2xl font-bold">{supervisorStats.total_supervisors}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Giám sát có chứng thực</p>
          <p className="text-2xl font-bold">{supervisorStats.supervisors_with_signoffs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Tổng chứng thực</p>
          <p className="text-2xl font-bold">{supervisorStats.total_signoffs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Thời gian chứng thực</p>
          <p className="text-2xl font-bold text-blue-600">{supervisorStats.average_signoff_time}</p>
        </div>
      </div>

      {/* Signoffs by supervisor */}
      {supervisorStats.signoffs_by_supervisor && supervisorStats.signoffs_by_supervisor.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium mb-3">Chứng thực theo giám sát</p>
          <div className="space-y-2">
            {supervisorStats.signoffs_by_supervisor.map(supervisor => (
              <div key={supervisor.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-gray-700">{supervisor.name}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {supervisor.total_signoffs} chứng thực
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Tổng công việc</p>
          <p className="text-2xl font-bold">{supervisorStats.quality_metrics.total_runs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Công việc hoàn thành</p>
          <p className="text-2xl font-bold text-green-600">{supervisorStats.quality_metrics.completed_runs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Công việc được chứng thực</p>
          <p className="text-2xl font-bold text-blue-600">{supervisorStats.quality_metrics.signed_runs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Tỷ lệ chưa chứng thực</p>
          <p className="text-2xl font-bold text-red-600">{supervisorStats.quality_metrics.unsigned_rate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Unsigned rate progress */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm font-medium mb-2">Tỷ lệ công việc chưa chứng thực</p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-red-500 h-3 rounded-full transition-all"
            style={{ width: `${supervisorStats.quality_metrics.unsigned_rate}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {(supervisorStats.quality_metrics.total_runs - supervisorStats.quality_metrics.signed_runs)} / {supervisorStats.quality_metrics.total_runs} công việc chưa chứng thực
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
