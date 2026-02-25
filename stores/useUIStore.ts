import { create } from 'zustand';
import { Checklist } from '../types';

export interface RunContext {
    runId: number;
    columnId: number;
    sessionId?: number;
    roleId?: number;
}

interface UIState {
    currentTab: string;
    activeChecklist: Checklist | null;
    activeRunContext: RunContext | null;
    showScanner: boolean;
}

interface UIActions {
    setCurrentTab: (tab: string) => void;
    setActiveChecklist: (checklist: Checklist | null) => void;
    setActiveRunContext: (ctx: RunContext | null) => void;
    setShowScanner: (show: boolean) => void;
    clearActiveRun: () => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
    // State
    currentTab: 'dashboard',
    activeChecklist: null,
    activeRunContext: null,
    showScanner: false,

    // Actions
    setCurrentTab: (tab) => set({ currentTab: tab }),
    setActiveChecklist: (checklist) => set({ activeChecklist: checklist }),
    setActiveRunContext: (ctx) => set({ activeRunContext: ctx }),
    setShowScanner: (show) => set({ showScanner: show }),
    clearActiveRun: () => set({ activeChecklist: null, activeRunContext: null }),
}));
