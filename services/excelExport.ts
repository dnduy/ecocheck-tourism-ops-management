
import * as XLSX from 'xlsx';
import { Checklist, User } from '../types';

export const exportChecklistsToExcel = (checklists: Checklist[], users: User[]) => {
  // 1. Prepare Helper to find User Name by ID
  const getUserName = (id: string | number) => {
    const user = users.find(u => String(u.id) === String(id));
    return user ? user.name : String(id);
  };

  // 2. Flatten Data: Create a row for every Checklist Item
  // This allows pivot tables and detailed analysis in Excel
  const flattenedData = checklists.flatMap(cl => {
    // Skip checklists without items
    if (!cl.items || cl.items.length === 0) return [];
    
    return cl.items.map(item => ({
      'Mã Phiếu': cl.id,
      'Tên Mẫu': cl.templateName,
      'Khu Vực': cl.area?.name || '',
      'Loại Khu Vực': cl.area?.type || '',
      'Ngày': cl.date,
      'Ca Trực': cl.shift,
      'Trạng Thái Phiếu': cl.status,
      'Người Thực Hiện': getUserName(cl.assignedTo),
      'Người Kiểm Tra': cl.verifiedBy ? getUserName(cl.verifiedBy) : '',
      'Thời Gian Hoàn Thành': cl.completedAt ? new Date(cl.completedAt).toLocaleString('vi-VN') : '',
      
      // Item Details
      'Tên Hạng Mục': item.text || '',
      'Quan Trọng': item.isCritical ? 'Có' : 'Không',
      'Kết Quả': item.status === 'PASS' ? 'ĐẠT' : (item.status === 'FAIL' ? 'KHÔNG ĐẠT' : 'Chưa làm'),
      'Ghi Chú/Sự Cố': item.note || ''
    }));
  });

  // Filter out empty rows
  const validData = flattenedData.filter(row => row['Mã Phiếu'] && row['Tên Hạng Mục']);

  if (validData.length === 0) {
    alert('Không có dữ liệu checklist để xuất');
    return;
  }

  // 3. Create Worksheet
  const worksheet = XLSX.utils.json_to_sheet(validData);

  // 4. Auto-width columns (Simple heuristic)
  const wscols = [
    { wch: 15 }, // ID
    { wch: 30 }, // Template
    { wch: 20 }, // Area
    { wch: 10 }, // Area Type
    { wch: 12 }, // Date
    { wch: 15 }, // Shift
    { wch: 15 }, // Status
    { wch: 20 }, // Staff
    { wch: 20 }, // Verifier
    { wch: 20 }, // Time
    { wch: 40 }, // Item Text
    { wch: 10 }, // Critical
    { wch: 10 }, // Result
    { wch: 30 }, // Note
  ];
  worksheet['!cols'] = wscols;

  // 5. Create Workbook and Append Sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dữ Liệu Chi Tiết");

  // 6. Generate Filename with Timestamp
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `EcoCheck_Data_${dateStr}.xlsx`);
};
