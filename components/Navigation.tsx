
import React from 'react';
import { LayoutDashboard, CheckSquare, AlertTriangle, PieChart, Settings, ShieldCheck } from 'lucide-react';
import { Role } from '../types';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  role: Role;
  pendingReviewCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, role, pendingReviewCount = 0 }) => {
  const getNavItems = () => {
    const items = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
      { id: 'checklists', icon: CheckSquare, label: 'Công việc' },
    ];

    if (role !== Role.STAFF) {
      items.push({ id: 'incidents', icon: AlertTriangle, label: 'Sự cố' });
    }
    
    if (role === Role.MANAGER || role === Role.SUPERVISOR) {
      items.push({ id: 'reports', icon: PieChart, label: 'Báo cáo' });
    }
    
    // Update: Allow both MANAGER and SUPERVISOR to access Admin (content inside will vary)
    if (role === Role.MANAGER || role === Role.SUPERVISOR) {
      items.push({ id: 'admin', icon: ShieldCheck, label: 'Quản trị' });
    } else {
      items.push({ id: 'settings', icon: Settings, label: 'Cài đặt' });
    }
    
    return items;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {getNavItems().map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.id === 'reports' && pendingReviewCount > 0 && (
                <span className="absolute -top-1 right-6 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
