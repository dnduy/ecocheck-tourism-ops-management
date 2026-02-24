import React from 'react';
import { WorkStatus } from '../types';
import { reviewService } from '../services/reviewService';
import { Play, CheckCircle2, Eye, RotateCcw } from 'lucide-react';

interface WorkStatusActionsProps {
  runId: number;
  workStatus: string;
  currentUserRole: string;
  isAssignee: boolean;
  isReviewer: boolean;
  onStatusChange: () => void;
}

/**
 * Component để hiển thị action buttons dựa trên work status
 * Flow: pending → in_progress → completed → needs_review → approved/rejected
 */
export const WorkStatusActions: React.FC<WorkStatusActionsProps> = ({
  runId,
  workStatus,
  currentUserRole,
  isAssignee,
  isReviewer,
  onStatusChange
}) => {
  const [loading, setLoading] = React.useState(false);
  const canApprove = currentUserRole === 'admin' || currentUserRole === 'manager';

  const handleAction = async (action: () => Promise<any>) => {
    setLoading(true);
    try {
      await action();
      onStatusChange();
    } catch (e: any) {
      alert('❌ Lỗi: ' + (e.message || 'Có lỗi xảy ra'));
    } finally {
      setLoading(false);
    }
  };

  // Staff workflow: pending → in_progress → completed → needs_review
  if (isAssignee) {
    if (workStatus === WorkStatus.PENDING) {
      return (
        <button
          disabled={loading}
          onClick={() => handleAction(() => reviewService.startWork(runId))}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Play size={16} />
          Bắt đầu làm
        </button>
      );
    }
    if (workStatus === WorkStatus.IN_PROGRESS) {
      return (
        <button
          disabled={loading}
          onClick={() => handleAction(() => reviewService.completeWork(runId))}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          Hoàn thành
        </button>
      );
    }
    if (workStatus === WorkStatus.COMPLETED) {
      return (
        <button
          disabled={loading}
          onClick={() => handleAction(() => reviewService.requestReview(runId))}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Eye size={16} />
          Yêu cầu duyệt
        </button>
      );
    }
    if (workStatus === WorkStatus.REJECTED) {
      return (
        <button
          disabled={loading}
          onClick={() => handleAction(() => reviewService.resubmit(runId))}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Gửi lại
        </button>
      );
    }
  }

  // Reviewer workflow: needs_review → approved or rejected
  if (isReviewer && canApprove && workStatus === WorkStatus.NEEDS_REVIEW) {
    return (
      <div className="flex gap-2">
        <button
          disabled={loading}
          onClick={() => handleAction(() => reviewService.approve(runId))}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium text-sm"
        >
          ✅ Phê duyệt
        </button>
        <button
          disabled={loading}
          onClick={() => {
            const note = prompt('Lý do từ chối:');
            if (note) {
              handleAction(() => reviewService.reject(runId, note));
            }
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium text-sm"
        >
          ❌ Từ chối
        </button>
      </div>
    );
  }

  return null;
};

/**
 * Hiển thị badge trạng thái công việc
 */
export const WorkStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const badges: Record<string, { label: string; className: string }> = {
    [WorkStatus.PENDING]: {
      label: '⏳ Chưa làm',
      className: 'bg-gray-100 text-gray-700 border border-gray-300'
    },
    [WorkStatus.IN_PROGRESS]: {
      label: '🔄 Đang làm',
      className: 'bg-blue-100 text-blue-700 border border-blue-300'
    },
    [WorkStatus.COMPLETED]: {
      label: '✅ Đã làm',
      className: 'bg-green-100 text-green-700 border border-green-300'
    },
    [WorkStatus.NEEDS_REVIEW]: {
      label: '👀 Chờ duyệt',
      className: 'bg-yellow-100 text-yellow-700 border border-yellow-300 animate-pulse'
    },
    [WorkStatus.APPROVED]: {
      label: '✅ Đã xác nhận',
      className: 'bg-emerald-100 text-emerald-700 border border-emerald-300'
    },
    [WorkStatus.REJECTED]: {
      label: '❌ Bị từ chối',
      className: 'bg-red-100 text-red-700 border border-red-300'
    }
  };

  const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-600' };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.className}`}>
      {badge.label}
    </span>
  );
};
