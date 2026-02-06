import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { reviewService, ReviewStats } from '../services/reviewService';
import { CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';

interface ReviewDashboardProps {
  currentUser: User;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadPendingReviews();
  }, []);

  const loadStats = async () => {
    try {
      const data = await reviewService.getStatusStats();
      setStats(data);
    } catch (e) {
      console.error('Load stats failed:', e);
    }
  };

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewService.getPendingReviews();
      setPendingReviews(data.data || []);
    } catch (e) {
      console.error('Load pending reviews failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (runId: number) => {
    const note = prompt('Ghi chú xác nhận (không bắt buộc):');
    if (note === null) return;
    try {
      await reviewService.approve(runId, note);
      alert('✅ Đã phê duyệt');
      loadStats();
      loadPendingReviews();
    } catch (e: any) {
      alert('❌ Lỗi: ' + (e.message || 'Không thể phê duyệt'));
    }
  };

  const handleReject = async (runId: number) => {
    const note = prompt('Lý do từ chối:');
    if (!note) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await reviewService.reject(runId, note);
      alert('❌ Đã từ chối');
      loadStats();
      loadPendingReviews();
    } catch (e: any) {
      alert('❌ Lỗi: ' + (e.message || 'Không thể từ chối'));
    }
  };

  if (currentUser.role !== 'supervisor' && currentUser.role !== 'manager' && currentUser.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Bạn không có quyền truy cập trang này</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Quản lý Duyệt Checklist</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {stats && [
          { label: 'Chờ làm', value: stats.pending, icon: Clock, color: 'bg-gray-100 text-gray-600' },
          { label: 'Đang làm', value: stats.in_progress, icon: Clock, color: 'bg-blue-100 text-blue-600' },
          { label: 'Đã làm', value: stats.completed, icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
          { label: 'Chờ duyệt', value: stats.needs_review, icon: Eye, color: 'bg-yellow-100 text-yellow-600' },
          { label: 'Đã xác nhận', value: stats.approved, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Bị từ chối', value: stats.rejected, icon: XCircle, color: 'bg-red-100 text-red-600' }
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} p-4 rounded-lg text-center`}>
            <stat.icon size={20} className="mx-auto mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs font-medium mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Reviews Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Checklist Chờ Duyệt</h2>
        
        {loading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : pendingReviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Không có checklist nào chờ duyệt</p>
        ) : (
          <div className="space-y-3">
            {pendingReviews.map((run) => (
              <div key={run.id} className="border border-gray-200 rounded-lg p-4 hover:border-brand-200 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{run.template?.name}</h3>
                    <p className="text-sm text-gray-600">
                      Khu vực: {run.area?.name} | 
                      Người làm: {run.assignedUser?.name} |
                      Yêu cầu duyệt: {run.review_requested_at ? new Date(run.review_requested_at).toLocaleString('vi-VN') : 'N/A'}
                    </p>
                    {run.source_template_note && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        📌 {run.source_template_note}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(run.id)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Phê duyệt
                    </button>
                    <button
                      onClick={() => handleReject(run.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Từ chối
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
