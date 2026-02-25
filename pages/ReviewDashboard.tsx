import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { reviewService, ReviewStats } from '../services/reviewService';
import { CheckCircle2, XCircle, Clock, Eye, RefreshCw } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  requireNote?: boolean;
  noteLabel?: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title, message, requireNote, noteLabel, confirmLabel, confirmClass, onConfirm, onCancel
}) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (requireNote && !note.trim()) {
      setError('Vui lòng nhập ' + (noteLabel || 'ghi chú'));
      return;
    }
    onConfirm(note.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {noteLabel || 'Ghi chú'}{requireNote && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
            rows={3}
            value={note}
            onChange={e => { setNote(e.target.value); setError(''); }}
            placeholder={requireNote ? 'Bắt buộc nhập...' : 'Không bắt buộc...'}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReviewDashboardProps {
  currentUser: User;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [actionRunId, setActionRunId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await reviewService.getStatusStats();
      setStats(data);
    } catch (e) {
      console.error('Load stats failed:', e);
    }
  }, []);

  const loadPendingReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reviewService.getPendingReviews();
      setPendingReviews(data.data || []);
    } catch (e) {
      console.error('Load pending reviews failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadPendingReviews();
  }, [loadStats, loadPendingReviews]);

  // Auto-clear toast after 3s
  useEffect(() => {
    if (actionSuccess || actionError) {
      const t = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess, actionError]);

  const handleModalConfirm = async (note: string) => {
    if (actionRunId === null || !actionType) return;
    try {
      if (actionType === 'approve') {
        await reviewService.approve(actionRunId, note);
        setActionSuccess('✅ Đã phê duyệt checklist');
      } else {
        await reviewService.reject(actionRunId, note);
        setActionSuccess('Đã từ chối checklist');
      }
      loadStats();
      loadPendingReviews();
    } catch (e: any) {
      setActionError('Lỗi: ' + (e.message || 'Không thể thực hiện'));
    } finally {
      setActionRunId(null);
      setActionType(null);
    }
  };

  const handleApprove = (runId: number) => {
    setActionRunId(runId);
    setActionType('approve');
  };

  const handleReject = (runId: number) => {
    setActionRunId(runId);
    setActionType('reject');
  };

  return (
    <div className="p-6">
      {/* Confirm Modal */}
      {actionRunId !== null && actionType && (
        <ConfirmModal
          title={actionType === 'approve' ? 'Phê duyệt checklist' : 'Từ chối checklist'}
          message={actionType === 'approve'
            ? 'Xác nhận phê duyệt checklist này?'
            : 'Bạn sắp từ chối checklist này. Vui lòng nhập lý do.'}
          requireNote={actionType === 'reject'}
          noteLabel={actionType === 'approve' ? 'Ghi chú xác nhận (không bắt buộc)' : 'Lý do từ chối'}
          confirmLabel={actionType === 'approve' ? 'Phê duyệt' : 'Từ chối'}
          confirmClass={actionType === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
          onConfirm={handleModalConfirm}
          onCancel={() => { setActionRunId(null); setActionType(null); }}
        />
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Duyệt Checklist</h1>
        <button
          onClick={() => { loadStats(); loadPendingReviews(); }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} />
          Làm mới
        </button>
      </div>

      {/* Toast notifications */}
      {actionSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ❌ {actionError}
        </div>
      )}

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
              <div key={run.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{run.template?.name}</h3>
                    <p className="text-sm text-gray-600">
                      Khu vực: {run.area?.name} |
                      Người làm: {run.assignedUser?.name} |
                      Yêu cầu duyệt: {run.review_requested_at
                        ? new Date(run.review_requested_at).toLocaleString('vi-VN')
                        : 'N/A'}
                    </p>
                    {run.source_template_note && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        📌 {run.source_template_note}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
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
