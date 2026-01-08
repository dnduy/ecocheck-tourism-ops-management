
export enum Role {
  STAFF = 'staff',
  SUPERVISOR = 'supervisor',
  MAINTENANCE = 'maintenance',
  MANAGER = 'manager'
}

export enum ChecklistStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed'
}

export enum IncidentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IncidentStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved'
}

export interface User {
  id: number | string;
  name: string;
  role: string; // 'manager' | 'supervisor' | 'staff' | 'maintenance'
  avatar?: string;
  email: string;
  password?: string;
}

export interface Area {
  id: number | string;
  name: string;
  type: string;
  description?: string;
}

export interface Session {
  id: number;
  time_hhmm: string;
  label?: string;
}

export interface RoleTemplate {
  id: number;
  name: string;
  description?: string;
}

export interface TemplateColumn {
  id: number;
  session_id: number;
  role_id?: number;
  time_hhmm: string;
  role_name?: string;
}

export interface Group {
  id: number;
  title: string;
  description?: string;
}

export interface Item {
  id: number;
  group_id?: number;
  content: string;
  is_critical: boolean;
  sort_order?: number;
}

export interface Entry {
  item_id: number;
  column_id: number;
  value?: string; // 'ok', 'not_ok', 'na'
  note?: string;
  photo_url?: string;
  checked_by?: number;
  checked_at?: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: 'OPENING' | 'HANDOVER' | 'CLOSING' | 'NORMAL';
  applicableAreaIds: string[];
}

// Legacy - kept for backward compatibility
export interface ChecklistItem {
  id: string;
  text: string;
  isCritical: boolean;
  status?: 'PASS' | 'FAIL';
  note?: string;
  photoUrl?: string;
}

// Legacy - kept for backward compatibility
export interface Checklist {
  id: string;
  templateName: string;
  area: Area;
  shift: string;
  date: string;
  status: ChecklistStatus;
  items: ChecklistItem[];
  assignedTo: string;
  verifiedBy?: string;
  completedAt?: string;
  verifiedAt?: string;
}

export interface Incident {
  id: number | string;
  title: string;
  description: string;
  area?: string | Area;
  severity?: string; // 'low' | 'medium' | 'high'
  status: string; // 'open' | 'in_progress' | 'resolved'
  reported_by?: string | number;
  assigned_to?: string | number;
  created_at?: string;
  updated_at?: string;
  resolution_note?: string;
  resolved_at?: string;
}
