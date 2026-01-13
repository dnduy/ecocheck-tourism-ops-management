import React, { useState, useEffect } from 'react';
import { statsService } from '../services/statsService';
import { ChevronDown, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PendingDetail {
  id: number;
  staff_name: string;
  area: string;
  template: string;
  requested_at: string;
  days_pending: number;
}

interface SupervisorStat {
  id: number;
  name: string;
  email: string;
  area: string;
  stats: {
    pending_review: number;
    approved: number;
    rejected: number;
    total_handled: number;
  };
  pending_details: PendingDetail[];
}

interface AdminSupervisorStatsProps {
  onRefresh?: () => void;
}

export const AdminSupervisorStats: React.FC<AdminSupervisorStatsProps> = ({ onRefresh }) => {
  const [supervisorStats, setSupervisorStats] = useState<SupervisorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSupervisor, setExpandedSupervisor] = useState<number | null>(null);

  useEffect(() => {
    loadSupervisorStats();
  }, []);

  const loadSupervisorStats = async () => {
    try {
      setLoading(true);
      const data = await statsService.getSupervisorStats();
      setSupervisorStats(data.data);
    } catch (error) {
      console.error('Error loading supervisor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  }

  const approvalRate = (stats: SupervisorStat['stats']) => {
    const { approved, total_handled } = stats;
    if (total_handled === 0) return 0;
    return Math.round((approved / total_handled) * 100);
  };

  return (
    <div className="space-y-3">
      {supervisorStats.map(supervisor => {
        const hasUrgent = supervisor.pending_details.some(p => p.days_pending > 2);

        return (
          <div key={supervisor.id} className="border rounded-lg overflow-hidden bg-white">
            {/* Header */}
            <button
              onClick={() => setExpandedSupervisor(expandedSupervisor === supervisor.id ? null : supervisor.id)}
              className="w-full p-4 hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{supervisor.name}</h3>
                  {hasUrgent && (
                    <AlertTriangle size={16} className="text-red-500" title="Có công việc chờ duyệt quá 2 ngày" />
                  )}
                </div>
                <p className="text-sm text-gray-500">{supervisor.email} • {supervisor.area}</p>
              </div>

              <div className="flex items-center gap-4">
                {/* Stats Summary */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{supervisor.stats.pending_review}</div>
                    <div className="text-xs text-gray-500">Chờ duyệt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{supervisor.stats.approved}</div>
                    <div className="text-xs text-gray-500">Duyệt OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{supervisor.stats.rejected}</div>
                    <div className="text-xs text-gray-500">Bị từ</div>
                  </div>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition ${expandedSupervisor === supervisor.id ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Summary Stats */}
            <div className="px-4 pb-3 border-t grid grid-cols-4 gap-2 bg-gray-50">
              <StatBox
                icon={<Clock className="text-yellow-500" size={16} />}
                label="Chờ duyệt"
                value={supervisor.stats.pending_review}
              />
              <StatBox
                icon={<CheckCircle className="text-green-500" size={16} />}
                label="Duyệt OK"
                value={supervisor.stats.approved}
              />
              <StatBox
                icon={<XCircle className="text-red-500" size={16} />}
                label="Bị từ"
                value={supervisor.stats.rejected}
              />
              <StatBox
                icon={<AlertTriangle className="text-blue-500" size={16} />}
                label="Xử lý"
                value={supervisor.stats.total_handled}
              />
            </div>

            {/* Expanded Details - Pending Items */}
            {expandedSupervisor === supervisor.id && (
              <div className="bg-gray-50 px-4 py-3 border-t">
                {supervisor.pending_details.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Công việc chờ duyệt ({supervisor.pending_details.length})
                    </h4>
                    {supervisor.pending_details.map(item => (
                      <div
                        key={item.id}
                        className={`p-2 rounded border ${
                          item.days_pending > 2 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.staff_name}</div>
                            <div className="text-sm text-gray-600">{item.template}</div>
                            <div className="text-xs text-gray-500">{item.area}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${item.days_pending > 2 ? 'text-red-600' : 'text-gray-600'}`}>
                              {item.days_pending} ngày
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(item.requested_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Không có công việc chờ duyệt
                  </div>
                )}

                {/* Performance */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-2">Hiệu suất</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded p-2 border text-center">
                      <div className="font-bold text-green-600">{approvalRate(supervisor.stats)}%</div>
                      <div className="text-xs text-gray-600">Tỷ lệ duyệt</div>
                    </div>
                    <div className="bg-white rounded p-2 border text-center">
                      <div className="font-bold text-gray-600">{supervisor.stats.total_handled}</div>
                      <div className="text-xs text-gray-600">Tổng xử lý</div>
                    </div>
                    <div className="bg-white rounded p-2 border text-center">
                      <div className="font-bold text-yellow-600">{supervisor.stats.pending_review}</div>
                      <div className="text-xs text-gray-600">Đang chờ</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StatBox: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex flex-col items-center gap-1 p-2 rounded bg-white border">
    {icon}
    <div className="font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-600">{label}</div>
  </div>
);
