
import { Checklist, ChecklistStatus, Incident, IncidentPriority, IncidentStatus, Role, User } from '../types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Nguyễn Văn A',
  role: Role.MANAGER, 
  avatar: 'https://picsum.photos/100/100',
  email: 'admin@ecocheck.vn',
  password: 'admin'
};

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Nguyễn Văn A', role: Role.MANAGER, avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=0c4a6e&color=fff', email: 'admin@ecocheck.vn', password: 'admin' },
  { id: 'u2', name: 'Trần Thị B', role: Role.STAFF, avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=0284c7&color=fff', email: 'staff@ecocheck.vn', password: 'staff' },
  { id: 'u3', name: 'Lê Văn C', role: Role.STAFF, avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=10b981&color=fff', email: 'staff2@ecocheck.vn', password: '123' },
  { id: 'u4', name: 'Phạm Giám Sát', role: Role.SUPERVISOR, avatar: 'https://ui-avatars.com/api/?name=Pham+Giam+Sat&background=f59e0b&color=fff', email: 'supervisor@ecocheck.vn', password: '123' },
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc1',
    title: 'Hỏng vòi sen phòng 102',
    description: 'Vòi sen bị rò rỉ nước liên tục ngay cả khi đã khóa van.',
    area: 'Khu Villa A',
    priority: IncidentPriority.HIGH,
    status: IncidentStatus.OPEN,
    reportedBy: 'Trần Thị B',
    createdAt: new Date().toISOString()
  }
];

export const MOCK_CHECKLISTS: Checklist[] = [
  {
    id: 'cl_bep_01',
    templateName: 'Checklist Bếp Chính - Đầu Ca',
    area: { id: 'a1', name: 'Bếp Trung Tâm', type: 'F&B' },
    shift: 'Đầu ca (08:00)',
    date: new Date().toISOString().split('T')[0],
    status: ChecklistStatus.PENDING,
    assignedTo: 'u2',
    items: [
      { id: 'b1', text: '1. Sắp xếp CCDC bếp nấu', isCritical: false },
      { id: 'b2', text: '2. Vệ sinh bếp nấu', isCritical: true },
      { id: 'b3', text: '3. Vệ sinh bàn Inox ra món', isCritical: false },
      { id: 'b6', text: '6. Khu vực bàn ra đồ chín', isCritical: true },
      { id: 'b14', text: '14. Khu vực tủ lạnh', isCritical: true },
      { id: 'b22', text: '22. Khu vực để ga (Kiểm tra rò rỉ)', isCritical: true },
      { id: 'b23', text: '23. Vệ sinh và kiểm tra thiết bị điện', isCritical: true },
    ]
  },
  {
    id: 'cl_wc_01',
    templateName: 'Kiểm tra Vệ Sinh (WC)',
    area: { id: 'a3', name: 'WC Khu Cổng', type: 'Facility' },
    shift: '09:00',
    date: new Date().toISOString().split('T')[0],
    status: ChecklistStatus.COMPLETED,
    assignedTo: 'u2',
    completedAt: new Date().toISOString(),
    items: [
      { id: 'wc1', text: 'Sàn nhà sạch, khô', isCritical: false, status: 'PASS' },
      { id: 'wc2', text: 'Bệt vệ sinh sạch sẽ', isCritical: true, status: 'PASS' },
      { id: 'wc6', text: 'Nước rửa tay đầy đủ', isCritical: false, status: 'FAIL', note: 'Hết nước rửa tay' },
    ]
  }
];
