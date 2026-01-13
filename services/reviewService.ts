import { apiGet, apiPost } from './api';

export interface ReviewStats {
  pending: number;
  in_progress: number;
  completed: number;
  needs_review: number;
  approved: number;
  rejected: number;
}

/**
 * ReviewService - Quản lý workflow duyệt checklist
 * Status flow: pending → in_progress → completed → needs_review → approved/rejected
 */
export const reviewService = {
  /**
   * Lấy danh sách runs cần duyệt
   */
  async getPendingReviews(page = 1): Promise<any> {
    return apiGet(`/review/pending?page=${page}`);
  },

  /**
   * Xem chi tiết run cần duyệt
   */
  async getForReview(runId: number): Promise<any> {
    return apiGet(`/review/runs/${runId}`);
  },

  /**
   * Bắt đầu làm checklist
   */
  async startWork(runId: number): Promise<any> {
    return apiPost(`/review/runs/${runId}/start`, {});
  },

  /**
   * Hoàn thành checklist
   */
  async completeWork(runId: number): Promise<any> {
    return apiPost(`/review/runs/${runId}/complete`, {});
  },

  /**
   * Yêu cầu duyệt
   */
  async requestReview(runId: number): Promise<any> {
    return apiPost(`/review/runs/${runId}/request-review`, {});
  },

  /**
   * Phê duyệt checklist
   */
  async approve(runId: number, reviewNote: string = ''): Promise<any> {
    return apiPost(`/review/runs/${runId}/approve`, {
      review_note: reviewNote
    });
  },

  /**
   * Từ chối checklist
   */
  async reject(runId: number, reviewNote: string): Promise<any> {
    return apiPost(`/review/runs/${runId}/reject`, {
      review_note: reviewNote
    });
  },

  /**
   * Gửi lại (Re-submit) sau khi bị reject
   */
  async resubmit(runId: number): Promise<any> {
    return apiPost(`/review/runs/${runId}/resubmit`, {});
  },

  /**
   * Lấy thống kê trạng thái
   */
  async getStatusStats(): Promise<ReviewStats> {
    return apiGet('/review/stats');
  },

  /**
   * Hiển thị status badge với màu sắc
   */
  getStatusBadge(status: string): { label: string; className: string } {
    const badges: Record<string, { label: string; className: string }> = {
      pending: { label: '⏳ Chưa làm', className: 'bg-gray-200 text-gray-800' },
      in_progress: { label: '🔄 Đang làm', className: 'bg-blue-200 text-blue-800' },
      completed: { label: '✅ Đã làm', className: 'bg-green-200 text-green-800' },
      needs_review: { label: '👀 Chờ duyệt', className: 'bg-yellow-200 text-yellow-800' },
      approved: { label: '✅ Đã xác nhận', className: 'bg-green-500 text-white' },
      rejected: { label: '❌ Bị từ chối', className: 'bg-red-500 text-white' }
    };
    return badges[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  }
};
