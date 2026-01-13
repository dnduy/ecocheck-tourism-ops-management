import React from 'react';
import { Incident } from '../types';
import { X, CheckCircle, Hammer } from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident | null;
  resolutionNote: string;
  onChangeResolutionNote: (note: string) => void;
  onClose: () => void;
  onMarkInProgress: (incident: Incident) => void;
  onResolve: (incident: Incident) => void;
}

const statusLabels: Record<string, string> = {
  open: 'Đang mở',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xong'
};

const getPriorityColor = (p: string) => {
  switch (p) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'resolved':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  resolutionNote,
  onChangeResolutionNote,
  onClose,
  onMarkInProgress,
  onResolve
}) => {
  if (!incident) return null;

  const priority = (incident as any).priority || incident.severity || 'medium';
  const status = incident.status || 'open';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end md:items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-2xl shadow-2xl border border-gray-100 p-5 md:p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPriorityColor(priority)}`}>
                {priority}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(status)}`}>
                {statusLabels[status] || status}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900">{incident.title}</h3>
            <p className="text-xs text-gray-500">Khu vực: {incident.area}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm text-gray-700">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1 font-semibold">Mô tả</p>
            <p>{incident.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 mb-1 font-semibold">Người báo</p>
              <p className="font-semibold text-gray-800">{incident.reportedBy || 'Không rõ'}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 mb-1 font-semibold">Thời gian</p>
              <p className="font-semibold text-gray-800">{incident.createdAt}</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] text-gray-500 mb-2 font-semibold flex items-center gap-1"><CheckCircle size={12}/> Ghi chú hoàn thành</p>
            <textarea 
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-200"
              rows={3}
              placeholder="Chi tiết cách xử lý sự cố (nếu có)"
              value={resolutionNote}
              onChange={(e) => onChangeResolutionNote(e.target.value)}
            />
            {status === 'resolved' && (incident as any).resolution_note && (
              <p className="text-[11px] text-gray-500 mt-1">Đã lưu trước đó: {(incident as any).resolution_note}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button 
            onClick={() => onMarkInProgress(incident)}
            disabled={status === 'resolved'}
            className="py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Hammer size={16}/> Nhận xử lý
          </button>
          <button 
            onClick={() => onResolve(incident)}
            className="py-3 bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-700"
          >
            <CheckCircle size={16}/> Đánh dấu hoàn thành
          </button>
        </div>
      </div>
    </div>
  );
};
