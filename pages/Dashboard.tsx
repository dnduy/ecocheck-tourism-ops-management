
import React, { useEffect, useState } from 'react';
import { User, Checklist, Incident, Role, ChecklistStatus, IncidentStatus, IncidentPriority } from '../types';
import {
  CheckCircle2, ArrowRight, ClipboardList,
  LogOut, TrendingUp, Wrench, ShieldAlert, Zap, Calendar, UserCheck, QrCode
} from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { dashboardService, type DashboardStats, type WeeklyStats } from '../services/dashboardService';

interface DashboardProps {
  user: User;
  users: User[];
  checklists: Checklist[];
  incidents: Incident[];
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  onOpenScanner: () => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ user, users, checklists, incidents, onChangeTab, onLogout, onOpenScanner }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 10) return 'vừa xong';
    if (diffSecs < 60) return `${diffSecs} giây trước`;

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} phút trước`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [s, w] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getWeeklyStats()
      ]);
      setStats(s);
      setWeekly(w);
      setLastUpdate(new Date());
    } catch (e) {
      console.error('Load dashboard stats failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const load = async () => {
      try {
        const [s, w] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getWeeklyStats()
        ]);
        if (mounted) {
          setStats(s);
          setWeekly(w);
          setLastUpdate(new Date());
          setIsLoading(false);
        }
      } catch (e) {
        console.error('Load dashboard stats failed:', e);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial load
    load();

    // Auto-refresh every 30 seconds
    intervalId = setInterval(() => {
      if (mounted) {
        load();
      }
    }, 30000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
  // Common stats
  const pendingIncidents = incidents.filter(i => i.status !== IncidentStatus.RESOLVED);
  const myChecklists = checklists.filter(c => String(c.assignedTo) === String(user.id));
  const myPendingChecklists = myChecklists.filter(c => c.status !== ChecklistStatus.COMPLETED);

  // Per-user stats (for supervisor/manager views)
  const staffUsers = users.filter(u => u.role === Role.STAFF);
  const userStats = staffUsers.map(su => {
    const mine = checklists.filter(c => String(c.assignedTo) === String(su.id));
    const completed = mine.filter(c => c.status === ChecklistStatus.REVIEWED || c.status === ChecklistStatus.COMPLETED).length;
    const inProgress = mine.filter(c => c.status === ChecklistStatus.IN_PROGRESS).length;
    const pending = mine.filter(c => c.status === ChecklistStatus.PENDING).length;
    const total = mine.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { user: su, total, completed, inProgress, pending, rate };
  }).sort((a, b) => b.rate - a.rate);

  // Dashboard Header with Logout
  const Header = () => (
    <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img src={user.avatar} alt="User" className="w-12 h-12 rounded-full border-2 border-brand-500 p-0.5" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">{user.name}</h1>
          <div className="flex items-center">
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">{user.role}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="p-2.5 bg-gray-50 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          title="Làm mới"
        >
          <svg
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={onLogout}
          className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
          title="Đăng xuất"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );

  // 1. MANAGER DASHBOARD
  const ManagerDashboard = () => {
    const chartData = (weekly && weekly.length > 0)
      ? weekly.map(d => ({ name: d.day, val: d.completed }))
      : [];

    return (
      <div className="space-y-5 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="md:col-span-3 bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-blue-700">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Đang tải dữ liệu...
          </div>
        )}

        {/* Last Update Indicator */}
        {lastUpdate && !isLoading && (
          <div className="md:col-span-3 flex items-center justify-end gap-2 text-[10px] text-gray-400">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            Cập nhật: {getRelativeTime(lastUpdate)}
          </div>
        )}

        <div className="md:col-span-2 bg-brand-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <p className="text-brand-200 text-xs font-medium uppercase tracking-widest mb-1">Hiệu suất vận hành</p>
            <h2 className="text-3xl font-bold mb-4">
              {isLoading ? (
                <span className="text-2xl">—</span>
              ) : (
                `${stats?.completion_rate || 0}%`
              )}
            </h2>
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex-1">
                <p className="text-[10px] text-brand-200 mb-1">Checklists</p>
                <p className="text-sm font-bold">
                  {isLoading ? '—' : `${stats?.completed_runs || 0}/${stats?.total_runs || 0}`}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex-1">
                <p className="text-[10px] text-brand-200 mb-1">Sự cố mới</p>
                <p className="text-sm font-bold text-orange-400">
                  +{isLoading ? '—' : (stats?.open_incidents || 0)}
                </p>
              </div>
            </div>
          </div>
          <TrendingUp className="absolute right-[-10px] bottom-[-10px] text-white/5 w-40 h-40" />
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Hành động nhanh</h3>
          <div className="grid grid-cols-1 gap-4 flex-1">
            <button onClick={() => onChangeTab('reports')} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between group active:scale-95 transition-all w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <Zap size={18} />
                </div>
                <span className="text-xs font-bold text-gray-700">Xem báo cáo</span>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-purple-600" />
            </button>
            <button onClick={() => onChangeTab('admin')} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between group active:scale-95 transition-all w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <span className="text-xs font-bold text-gray-700">Quản trị</span>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-brand-600" />
            </button>
          </div>
        </div>

        <div className="md:col-span-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Hoàn thành theo ngày</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-400">Đang tải biểu đồ...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={chartData}>
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#0ea5e9' : '#e0f2fe'} />
                    ))}
                  </Bar>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. STAFF DASHBOARD
  const StaffDashboard = () => {
    const myCompletionRate = myChecklists.length > 0
      ? Math.round(((myChecklists.length - myPendingChecklists.length) / myChecklists.length) * 100)
      : 0;

    return (
      <div className="space-y-6">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-blue-700">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Đang tải dữ liệu...
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Công việc của bạn</h2>
            <p className="text-sm text-gray-500 mb-4">Bạn có {myPendingChecklists.length} việc cần hoàn thành hôm nay.</p>
            <div className="flex items-center justify-between bg-brand-50 p-4 rounded-2xl border border-brand-100">
              <div>
                <p className="text-[10px] font-bold text-brand-600 uppercase">Tiến độ ca trực</p>
                <p className="text-lg font-black text-brand-900">{myCompletionRate}%</p>
              </div>
              <button
                onClick={() => onChangeTab('checklists')}
                className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-brand-200"
              >
                Bắt đầu ngay
              </button>
            </div>
          </div>
          <ClipboardList className="absolute right-[-20px] top-[-20px] text-brand-50 w-32 h-32 -rotate-12" />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-800 ml-1">Lịch trình sắp tới</h3>
          {myPendingChecklists.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center">
              <CheckCircle2 size={48} className="mx-auto text-green-100 mb-2" />
              <p className="text-sm text-gray-500 font-medium">Bạn đã hoàn thành tất cả công việc!</p>
            </div>
          ) : (
            myPendingChecklists.slice(0, 3).map(cl => (
              <div key={cl.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{cl.templateName}</h4>
                  <p className="text-[10px] text-gray-500">{cl.area.name} • {cl.shift}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300" />
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // 3. MAINTENANCE DASHBOARD
  const MaintenanceDashboard = () => (
    <div className="space-y-6">
      <div className="bg-orange-600 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <p className="text-orange-100 text-xs font-bold uppercase mb-1">Sự cố đang mở</p>
          <h2 className="text-4xl font-black">{pendingIncidents.length}</h2>
          <p className="text-[10px] text-orange-100 mt-2 flex items-center gap-1">
            <ShieldAlert size={12} /> {incidents.filter(i => i.priority === IncidentPriority.CRITICAL).length} sự cố khẩn cấp
          </p>
        </div>
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Wrench size={40} className="text-white" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center ml-1">
          <h3 className="text-sm font-bold text-gray-800">Cần xử lý gấp</h3>
          <button onClick={() => onChangeTab('incidents')} className="text-xs text-brand-600 font-bold">Tất cả</button>
        </div>
        {pendingIncidents.slice(0, 4).map(inc => (
          <div key={inc.id} className="bg-white p-4 rounded-2xl border-l-4 border-l-orange-500 border-y border-r border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-bold text-gray-900 truncate pr-4">{inc.title}</h4>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${inc.priority === IncidentPriority.CRITICAL ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                {inc.priority}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3 line-clamp-1">{inc.area}</p>
            <div className="flex gap-2">
              <button
                onClick={() => onChangeTab('incidents')}
                className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-colors"
              >
                Chi tiết
              </button>
              <button className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-[10px] font-bold hover:bg-brand-700 shadow-md shadow-brand-100">
                Xử lý
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 4. SUPERVISOR DASHBOARD
  const SupervisorDashboard = () => {
    const pendingCount = checklists.filter(c => c.status === ChecklistStatus.PENDING).length;
    const completedToday = checklists.filter(c => c.status === ChecklistStatus.COMPLETED || c.status === ChecklistStatus.REVIEWED).length;

    return (
      <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="md:col-span-3 bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-blue-700">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Đang tải dữ liệu...
          </div>
        )}

        {/* Stats from API */}
        {!isLoading && stats && (
          <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-brand-600 to-brand-700 text-white p-5 rounded-3xl shadow-xl flex flex-col justify-center">
            <p className="text-brand-100 text-xs font-bold uppercase mb-1">Hiệu suất hệ thống</p>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-black">{stats.completion_rate}%</div>
              <div className="flex-1 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-brand-100">Hoàn thành</span>
                  <span className="font-bold">{stats.completed_runs}/{stats.total_runs}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${stats.completion_rate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Card */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col justify-center">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <ClipboardList size={22} />
              </div>
              <p className="text-xl font-black text-gray-900">{pendingCount}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Chờ xử lý</p>
            </div>
            <div className="w-[1px] h-12 bg-gray-100"></div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={22} />
              </div>
              <p className="text-xl font-black text-gray-900">{completedToday}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Xong hôm nay</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Thống kê theo nhân sự</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userStats.slice(0, 6).map(stat => (
              <div key={stat.user.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <img src={stat.user.avatar} className="w-8 h-8 rounded-full border-2 border-white" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{stat.user.name}</p>
                    <p className="text-[10px] text-gray-500">Hoàn thành: {stat.completed}/{stat.total}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-brand-50 text-brand-700">{stat.rate}%</span>
              </div>
            ))}
            {userStats.length === 0 && (
              <p className="text-xs text-gray-400">Chưa có dữ liệu nhiệm vụ cho nhân sự.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-1 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500" /> Cảnh báo
          </h3>
          <div className="space-y-4">
            {incidents.filter(i => i.priority === IncidentPriority.CRITICAL || i.priority === IncidentPriority.HIGH).length > 0 ? (
              incidents.filter(i => i.priority === IncidentPriority.CRITICAL || i.priority === IncidentPriority.HIGH).slice(0, 3).map(inc => (
                <div key={inc.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{inc.title}</h4>
                    <p className="text-[10px] text-gray-500">{inc.area} • {inc.assignedTo || 'Chưa gán'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">Hệ thống hiện tại ổn định</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onChangeTab('checklists')}
          className="md:col-span-3 w-full py-4 bg-brand-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-100 active:scale-95 transition-all hover:bg-brand-700"
        >
          <UserCheck size={20} /> Kiểm tra tiến độ khu vực
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 pb-24 space-y-4 min-h-full relative">
      <Header />

      {(user.role === Role.ADMIN || user.role === Role.MANAGER) && <ManagerDashboard />}
      {user.role === Role.STAFF && <StaffDashboard />}
      {user.role === Role.MAINTENANCE && <MaintenanceDashboard />}
      {user.role === Role.SUPERVISOR && <SupervisorDashboard />}

      {/* Floating QR Scan Button (Available for all roles except Manager usually, but keeping global for demo) */}
      <button
        onClick={onOpenScanner}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform border-4 border-white/20"
      >
        <QrCode size={24} />
      </button>

      {/* Footer Info */}
      <div className="pt-4 text-center">
        <p className="text-[10px] text-gray-400 font-medium">Hệ thống vận hành EcoCheck v3.0</p>
      </div>
    </div>
  );
});
