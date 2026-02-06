import React from 'react';
import { LayoutDashboard, CheckSquare, AlertTriangle, PieChart, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
    role: Role;
    pendingReviewCount?: number;
    onLogout?: () => void;
    user?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, role, pendingReviewCount = 0, onLogout, user }) => {
    const getNavItems = () => {
        const items = [
            { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
            { id: 'checklists', icon: CheckSquare, label: 'Công việc' },
        ];

        if (role !== Role.STAFF) {
            items.push({ id: 'incidents', icon: AlertTriangle, label: 'Sự cố' });
        }

        if (role === Role.ADMIN || role === Role.MANAGER || role === Role.SUPERVISOR) {
            items.push({ id: 'reports', icon: PieChart, label: 'Báo cáo' });
        }

        if (role === Role.ADMIN || role === Role.MANAGER || role === Role.SUPERVISOR) {
            items.push({ id: 'admin', icon: ShieldCheck, label: 'Quản trị' });
        } else {
            items.push({ id: 'settings', icon: Settings, label: 'Cài đặt' });
        }

        return items;
    };

    return (
        <aside className="h-full bg-white border-r border-gray-200 flex flex-col shadow-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-center">
                <h1 className="text-xl font-bold text-brand-600 tracking-tight flex items-center gap-2">
                    <span className="p-1.5 bg-brand-100 rounded-lg">🌱</span> EcoCheck
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {getNavItems().map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={22} className={isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'} />
                            <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>

                            {item.id === 'reports' && pendingReviewCount > 0 && (
                                <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    {pendingReviewCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border border-brand-200">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{role}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-100 bg-white"
                >
                    <LogOut size={16} />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
};
