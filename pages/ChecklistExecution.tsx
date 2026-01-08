
import React, { useState } from 'react';
import { Checklist, ChecklistItem, ChecklistStatus, User } from '../types';
import { entryService } from '../services/entryService';
import { runService } from '../services/runService';
import { signoffService } from '../services/signoffService';
import { sanitizeInput } from '../services/validation';
import { ArrowLeft, Check, X, Camera, AlertTriangle, Info, ShieldCheck, UserCheck, ChevronRight, Plus, User as UserIcon } from 'lucide-react';

interface ChecklistExecutionProps {
  checklist: Checklist;
  currentUser: User;
  runContext?: { runId: number; columnId: number };
  onBack: () => void;
  onComplete: (updatedChecklist: Checklist) => void;
  onCreateIncident: (title: string, description: string, areaName: string) => void;
}

export const ChecklistExecution: React.FC<ChecklistExecutionProps> = ({ checklist, currentUser, runContext, onBack, onComplete, onCreateIncident }) => {
  const [items, setItems] = useState<ChecklistItem[]>(checklist.items);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Incident Reporting States
  const [reportingIncidentId, setReportingIncidentId] = useState<string | null>(null);
  const [incidentDesc, setIncidentDesc] = useState('');
  const [reportedItems, setReportedItems] = useState<Set<string>>(new Set());

  // Manual Incident State
  const [isReportingManual, setIsReportingManual] = useState(false);
  const [manualIncident, setManualIncident] = useState({ title: '', desc: '' });

  const isExecutor = checklist.assignedTo === currentUser.id;
  const isVerifier = checklist.verifiedBy === currentUser.id;
  
  // Logic: Nhân viên chỉ có thể sửa nếu chưa COMPLETED. Verifier không thể sửa items, chỉ có thể Confirm.
  const isReadOnly = checklist.status === ChecklistStatus.REVIEWED || 
                     (isVerifier && checklist.status === ChecklistStatus.COMPLETED) ||
                     (!isExecutor && !isVerifier);

  const handleStatusChange = async (itemId: string, status: 'PASS' | 'FAIL') => {
    if (isReadOnly || checklist.status === ChecklistStatus.COMPLETED) return;
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, status } : item));
    if (status === 'PASS') {
      setReportingIncidentId(null);
    }

    if (runContext) {
      try {
        await entryService.upsert({
          run_id: runContext.runId,
          item_id: Number(itemId),
          column_id: runContext.columnId,
          value: status === 'PASS' ? 'ok' : 'not_ok'
        });
      } catch (e) {
        console.error('Save entry failed:', e);
      }
    }
  };

  const calculateProgress = () => {
    const answered = items.filter(i => i.status).length;
    return Math.round((answered / items.length) * 100);
  };

  const handleStaffSubmit = async () => {
    if (items.some(i => i.status === 'FAIL')) {
      if (!window.confirm("Có hạng mục KHÔNG ĐẠT, bạn vẫn muốn gửi báo cáo?")) return;
    }
    if (!runContext) return;
    setIsSubmitting(true);
    try {
      await runService.update(runContext.runId, { status: 'completed' });
      onComplete({
        ...checklist,
        status: ChecklistStatus.COMPLETED,
        items: items,
        completedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Submit checklist failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!runContext) return;
    setIsSubmitting(true);
    try {
      if (runContext.sessionId) {
        await signoffService.create({
          run_id: runContext.runId,
          session_id: runContext.sessionId,
          role_id: runContext.roleId
        });
      }
      await runService.update(runContext.runId, { status: 'reviewed' });
      onComplete({
        ...checklist,
        status: ChecklistStatus.REVIEWED,
        verifiedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Verify checklist failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportIncident = (item: ChecklistItem) => {
    const cleanDesc = sanitizeInput(incidentDesc);
    const finalDesc = cleanDesc || "Sự cố được phát hiện trong quá trình thực hiện checklist.";
    
    if (finalDesc.length < 5) {
      alert("Vui lòng nhập mô tả chi tiết hơn (ít nhất 5 ký tự)");
      return;
    }
    
    // 1. Create Incident Ticket
    onCreateIncident(
      item.text, 
      finalDesc,
      checklist.area.name
    );

    // 2. Update Checklist Item with Note (CRITICAL FIX: Ensure note is saved in checklist)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, note: finalDesc } : i));

    setReportedItems(prev => new Set(prev).add(item.id));
    setReportingIncidentId(null);
    setIncidentDesc('');
  };

  const handleManualReportSubmit = () => {
    const cleanTitle = sanitizeInput(manualIncident.title);
    const cleanDesc = sanitizeInput(manualIncident.desc);
    
    if (!cleanTitle || cleanTitle.length < 3) {
      alert("Vui lòng nhập tiêu đề (ít nhất 3 ký tự)");
      return;
    }
    if (!cleanDesc || cleanDesc.length < 5) {
      alert("Vui lòng nhập mô tả chi tiết (ít nhất 5 ký tự)");
      return;
    }
    onCreateIncident(cleanTitle, cleanDesc, checklist.area.name);
    setIsReportingManual(false);
    setManualIncident({ title: '', desc: '' });
  };

  const progress = calculateProgress();
  const allAnswered = items.every(i => i.status);

  return (
    <div className="bg-gray-50 min-h-screen pb-28 flex flex-col">
      <div className="bg-white p-5 shadow-sm sticky top-0 z-20 rounded-b-3xl">
        <div className="flex items-center mb-5">
          <button onClick={onBack} className="p-2.5 -ml-2 hover:bg-gray-50 rounded-2xl transition-colors"><ArrowLeft size={24} /></button>
          <div className="ml-3">
            <h1 className="font-bold text-gray-900 leading-tight text-lg">{checklist.templateName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                 checklist.status === ChecklistStatus.REVIEWED ? 'bg-green-50 text-green-600 border-green-100' : 'bg-brand-50 text-brand-600 border-brand-100'
               }`}>{checklist.status}</span>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{checklist.area.name}</p>
            </div>
          </div>
        </div>

        {/* User Role Banner */}
        <div className="mb-4">
          {isExecutor ? (
            <div className="bg-brand-50 text-brand-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-brand-100">
               <UserCheck size={16} /> Bạn là NGƯỜI THỰC HIỆN checklist này
            </div>
          ) : isVerifier ? (
             <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-purple-100">
               <ShieldCheck size={16} /> Bạn là NGƯỜI KIỂM DUYỆT (Giám sát)
            </div>
          ) : (
            <div className="bg-gray-50 text-gray-500 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-200">
               <Info size={16} /> Bạn đang xem với quyền: {currentUser.role}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-bold text-gray-400">TIẾN ĐỘ THỰC HIỆN</span>
          <span className="text-[10px] font-black text-brand-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-brand-500 h-2 rounded-full transition-all duration-500 shadow-sm shadow-brand-100" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {items.map((item, idx) => (
          <div key={item.id} className={`bg-white rounded-3xl p-5 border shadow-sm transition-all duration-300 ${item.status === 'FAIL' ? 'border-red-100 bg-red-50/10' : 'border-gray-50'}`}>
            <div className="flex items-start gap-3 mb-5">
              <span className="w-6 h-6 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
              <p className="text-gray-800 font-bold text-sm pt-0.5">{item.text}</p>
              {item.isCritical && <AlertTriangle size={14} className="text-red-500 shrink-0 mt-1" />}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isReadOnly || checklist.status === ChecklistStatus.COMPLETED}
                onClick={() => handleStatusChange(item.id, 'PASS')}
                className={`py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-95 ${item.status === 'PASS' ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'}`}
              >
                <Check size={16} /> ĐẠT
              </button>
              <button
                disabled={isReadOnly || checklist.status === ChecklistStatus.COMPLETED}
                onClick={() => handleStatusChange(item.id, 'FAIL')}
                className={`py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-95 ${item.status === 'FAIL' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'}`}
              >
                <X size={16} /> KHÔNG ĐẠT
              </button>
            </div>

            {/* Incident Reporting Section */}
            {item.status === 'FAIL' && (
              <div className="mt-4 pt-4 border-t border-red-100/30">
                {reportedItems.has(item.id) || item.note ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-red-500 bg-red-50 py-3 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                       <Check size={14} /> ĐÃ BÁO CÁO SỰ CỐ
                    </div>
                    {item.note && <p className="text-[10px] italic px-2 text-center text-red-400">"{item.note}"</p>}
                  </div>
                ) : (
                  <>
                    {reportingIncidentId === item.id ? (
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <textarea
                          autoFocus
                          placeholder="Nhập mô tả chi tiết về sự cố..."
                          className="w-full p-3 bg-white border border-red-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-red-100 transition-all min-h-[80px]"
                          value={incidentDesc}
                          onChange={(e) => setIncidentDesc(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setReportingIncidentId(null); setIncidentDesc(''); }}
                            className="flex-1 py-2.5 text-[10px] font-bold text-gray-400 hover:bg-gray-50 rounded-xl"
                          >
                            HỦY
                          </button>
                          <button 
                            onClick={() => handleReportIncident(item)}
                            className="flex-[2] py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-red-100"
                          >
                            GỬI SỰ CỐ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setReportingIncidentId(item.id)}
                        className="w-full py-3 bg-white text-red-600 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 border-2 border-red-100 hover:bg-red-50 transition-colors active:scale-95"
                      >
                        <AlertTriangle size={14} /> BÁO CÁO SỰ CỐ
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Manual Incident Reporting */}
        {isExecutor && checklist.status !== ChecklistStatus.COMPLETED && checklist.status !== ChecklistStatus.REVIEWED && (
          <div className="mt-6 mb-2">
            {!isReportingManual ? (
               <button 
                 onClick={() => setIsReportingManual(true)}
                 className="w-full py-3 border-2 border-dashed border-red-200 text-red-400 rounded-3xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-all"
               >
                 <Plus size={16} /> BÁO CÁO SỰ CỐ PHÁT SINH
               </button>
            ) : (
               <div className="bg-red-50 p-5 rounded-3xl border border-red-100 animate-in slide-in-from-bottom-2 shadow-sm">
                 <h3 className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-2">
                   <AlertTriangle size={14}/> Báo cáo sự cố phát sinh
                 </h3>
                 <input 
                   type="text" 
                   placeholder="Tiêu đề sự cố (VD: Hỏng khóa cửa chính)"
                   className="w-full p-3 mb-3 bg-white border border-red-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-100"
                   value={manualIncident.title}
                   onChange={e => setManualIncident({...manualIncident, title: e.target.value})}
                 />
                 <textarea
                   placeholder="Mô tả chi tiết..."
                   className="w-full p-3 mb-3 bg-white border border-red-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-100 min-h-[80px]"
                   value={manualIncident.desc}
                   onChange={e => setManualIncident({...manualIncident, desc: e.target.value})}
                 />
                 <div className="flex gap-3">
                   <button 
                     onClick={() => setIsReportingManual(false)}
                     className="flex-1 py-3 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                   >
                     HỦY BỎ
                   </button>
                   <button 
                     onClick={handleManualReportSubmit}
                     className="flex-[2] py-3 text-[10px] font-bold text-white bg-red-600 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700"
                   >
                     GỬI BÁO CÁO
                   </button>
                 </div>
               </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-5 border-t border-gray-100 pb-safe z-30 shadow-2xl rounded-t-3xl">
        {/* Case 1: Nhân viên gửi báo cáo */}
        {isExecutor && checklist.status !== ChecklistStatus.COMPLETED && checklist.status !== ChecklistStatus.REVIEWED && (
          <button
            disabled={!allAnswered || isSubmitting}
            onClick={handleStaffSubmit}
            className={`w-full py-4.5 rounded-2xl font-black text-sm text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${allAnswered ? 'bg-brand-600 shadow-brand-200' : 'bg-gray-300'}`}
          >
            {isSubmitting ? 'ĐANG GỬI BÁO CÁO...' : 'HOÀN THÀNH & GỬI KIỂM TRA'}
            {!isSubmitting && <ChevronRight size={18} />}
          </button>
        )}

        {/* Case 2: Giám sát xác nhận */}
        {isVerifier && checklist.status === ChecklistStatus.COMPLETED && (
          <div className="flex gap-4">
            <button
              onClick={() => {
                if(window.confirm("Yêu cầu nhân viên thực hiện lại các hạng mục chưa đạt?")) {
                  onComplete({...checklist, status: ChecklistStatus.IN_PROGRESS});
                  onBack();
                }
              }}
              className="flex-1 py-4.5 bg-white text-orange-600 rounded-2xl font-black text-xs border-2 border-orange-100 hover:bg-orange-50 active:scale-95 transition-all"
            >
              YÊU CẦU SỬA
            </button>
            <button
              onClick={handleVerifySubmit}
              disabled={isSubmitting}
              className="flex-[2] py-4.5 bg-purple-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-purple-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <ShieldCheck size={20} /> {isSubmitting ? 'ĐANG PHÊ DUYỆT...' : 'XÁC NHẬN HOÀN TẤT'}
            </button>
          </div>
        )}

        {/* Trạng thái đã đóng */}
        {checklist.status === ChecklistStatus.REVIEWED && (
           <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center flex items-center justify-center gap-2">
              <Check className="text-green-600" size={20} />
              <span className="text-sm font-black text-green-700 uppercase">Dữ liệu đã được chốt và lưu trữ</span>
           </div>
        )}
      </div>
    </div>
  );
};
