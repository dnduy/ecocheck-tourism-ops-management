
import { Checklist, Incident, User, Role, Area, Shift } from '../types';
import { MOCK_CHECKLISTS, MOCK_INCIDENTS, MOCK_USERS } from './mockData';

const KEYS = {
  USERS: 'ecocheck_users',
  CHECKLISTS: 'ecocheck_checklists',
  INCIDENTS: 'ecocheck_incidents',
  AREAS: 'ecocheck_areas',
  SHIFTS: 'ecocheck_shifts',
  CURRENT_USER: 'ecocheck_user_session'
};

const MOCK_AREAS: Area[] = [
  { id: 'a1', name: 'Bếp Trung Tâm', type: 'F&B' },
  { id: 'a2', name: 'Nhà Hàng A', type: 'F&B' },
  { id: 'a3', name: 'WC Khu Cổng', type: 'Facility' },
  { id: 'a4', name: 'Sảnh Lễ Tân', type: 'Hotel' },
  { id: 'a5', name: 'Khu Villa A', type: 'Hotel' },
  { id: 'a6', name: 'Hồ Bơi Chính', type: 'Facility' },
  { id: 'a7', name: 'Vườn Lan', type: 'Garden' }
];

const MOCK_SHIFTS: Shift[] = [
  { id: 's1', name: 'Ca Sáng (Chuẩn bị)', startTime: '06:00', endTime: '08:00', type: 'OPENING', applicableAreaIds: ['a1', 'a2'] },
  { id: 's2', name: 'Giao Ca Trưa', startTime: '13:30', endTime: '14:00', type: 'HANDOVER', applicableAreaIds: [] }, // All areas
  { id: 's3', name: 'Đóng Ca Tối', startTime: '21:30', endTime: '22:30', type: 'CLOSING', applicableAreaIds: [] },
  { id: 's4', name: 'Vệ sinh định kỳ sáng', startTime: '09:00', endTime: '10:00', type: 'NORMAL', applicableAreaIds: ['a3', 'a6'] }
];

// Helper to simulate API delay (optional, makes it feel real)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class LocalDatabase {
  // --- INITIALIZATION ---
  init() {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(KEYS.CHECKLISTS)) {
      localStorage.setItem(KEYS.CHECKLISTS, JSON.stringify(MOCK_CHECKLISTS));
    }
    if (!localStorage.getItem(KEYS.INCIDENTS)) {
      localStorage.setItem(KEYS.INCIDENTS, JSON.stringify(MOCK_INCIDENTS));
    }
    if (!localStorage.getItem(KEYS.AREAS)) {
      localStorage.setItem(KEYS.AREAS, JSON.stringify(MOCK_AREAS));
    }
    if (!localStorage.getItem(KEYS.SHIFTS)) {
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(MOCK_SHIFTS));
    }
  }

  // --- GENERIC HELPERS ---
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private save<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- AUTH ---
  getSession(): User | null {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  setSession(user: User) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }

  // --- USERS ---
  async getUsers(): Promise<User[]> {
    await delay(100); // Simulate network
    return this.get<User>(KEYS.USERS);
  }

  async createUser(user: User): Promise<User> {
    const users = this.get<User>(KEYS.USERS);
    users.push(user);
    this.save(KEYS.USERS, users);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const users = this.get<User>(KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    
    users[index] = { ...users[index], ...updates };
    this.save(KEYS.USERS, users);
    
    // Update session if it's the current user
    const session = this.getSession();
    if (session && session.id === id) {
      this.setSession(users[index]);
    }
    
    return users[index];
  }

  async deleteUser(id: string): Promise<void> {
    let users = this.get<User>(KEYS.USERS);
    users = users.filter(u => u.id !== id);
    this.save(KEYS.USERS, users);
  }

  // --- AREAS ---
  async getAreas(): Promise<Area[]> {
    await delay(50);
    return this.get<Area>(KEYS.AREAS);
  }

  async createArea(area: Area): Promise<Area> {
    const areas = this.get<Area>(KEYS.AREAS);
    areas.push(area);
    this.save(KEYS.AREAS, areas);
    return area;
  }

  async deleteArea(id: string): Promise<void> {
    let areas = this.get<Area>(KEYS.AREAS);
    areas = areas.filter(a => a.id !== id);
    this.save(KEYS.AREAS, areas);
  }

  // --- SHIFTS ---
  async getShifts(): Promise<Shift[]> {
    await delay(50);
    return this.get<Shift>(KEYS.SHIFTS);
  }

  async createShift(shift: Shift): Promise<Shift> {
    const shifts = this.get<Shift>(KEYS.SHIFTS);
    shifts.push(shift);
    this.save(KEYS.SHIFTS, shifts);
    return shift;
  }

  async deleteShift(id: string): Promise<void> {
    let shifts = this.get<Shift>(KEYS.SHIFTS);
    shifts = shifts.filter(s => s.id !== id);
    this.save(KEYS.SHIFTS, shifts);
  }

  // --- CHECKLISTS ---
  async getChecklists(): Promise<Checklist[]> {
    await delay(100);
    return this.get<Checklist>(KEYS.CHECKLISTS);
  }

  async createChecklist(checklist: Checklist): Promise<Checklist> {
    const list = this.get<Checklist>(KEYS.CHECKLISTS);
    list.unshift(checklist); // Add to top
    this.save(KEYS.CHECKLISTS, list);
    return checklist;
  }

  async updateChecklist(updatedList: Checklist): Promise<Checklist> {
    const list = this.get<Checklist>(KEYS.CHECKLISTS);
    const index = list.findIndex(c => c.id === updatedList.id);
    if (index !== -1) {
      list[index] = updatedList;
      this.save(KEYS.CHECKLISTS, list);
    }
    return updatedList;
  }

  // --- INCIDENTS ---
  async getIncidents(): Promise<Incident[]> {
    await delay(100);
    return this.get<Incident>(KEYS.INCIDENTS);
  }

  async createIncident(incident: Incident): Promise<Incident> {
    const list = this.get<Incident>(KEYS.INCIDENTS);
    list.unshift(incident);
    this.save(KEYS.INCIDENTS, list);
    return incident;
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<void> {
    const list = this.get<Incident>(KEYS.INCIDENTS);
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.save(KEYS.INCIDENTS, list);
    }
  }
}

export const db = new LocalDatabase();
