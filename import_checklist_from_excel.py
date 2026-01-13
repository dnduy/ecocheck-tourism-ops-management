#!/usr/bin/env python3
"""
Script import checklist templates từ file Excel vào MySQL database
"""

import openpyxl
import mysql.connector
from datetime import datetime
import json

# Database connection
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'ecocheck',
    'password': 'ecocheck_password',
    'database': 'ecocheck'
}

EXCEL_FILE = "CHECKLIST TUNG KHU 2025 20.8.xlsx"

def connect_db():
    """Kết nối MySQL database"""
    return mysql.connector.connect(**DB_CONFIG)

def parse_sheet_trang_bep(ws):
    """Parse sheet TRANG BẾP"""
    template = {
        'name': 'Checklist Bếp Chính',
        'version': 'v1',
        'description': 'Checklist kiểm tra bếp chính theo 3 ca',
        'groups': [],
        'columns': [
            {'label': 'Đầu ca (8h) - Người kiểm tra', 'type': 'checkbox', 'sort_order': 1},
            {'label': 'Đầu ca (8h) - Người giám sát', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'Giao ca (13h) - Người kiểm tra', 'type': 'checkbox', 'sort_order': 3},
            {'label': 'Giao ca (13h) - Người giám sát', 'type': 'checkbox', 'sort_order': 4},
            {'label': 'Cuối ca (17h) - Người kiểm tra', 'type': 'checkbox', 'sort_order': 5},
            {'label': 'Cuối ca (17h) - Người giám sát', 'type': 'checkbox', 'sort_order': 6},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 7},
        ]
    }
    
    # Parse items from row 4 onwards
    items = []
    current_group = None
    group_items = []
    
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if stt_cell and str(stt_cell).isdigit() and content_cell:
            # Đây là một item
            items.append({
                'title': str(content_cell).strip(),
                'sort_order': int(stt_cell)
            })
    
    # Tạo 1 group chung
    template['groups'].append({
        'title': 'Công việc kiểm tra bếp',
        'items': items,
        'sort_order': 1
    })
    
    return template

def parse_sheet_trinh_bar(ws):
    """Parse sheet TRINH BAR"""
    template = {
        'name': 'Checklist Quầy Bar',
        'version': 'v1',
        'description': 'Checklist kiểm tra quầy bar theo 2 ca',
        'groups': [],
        'columns': [
            {'label': '8h - Người kiểm tra', 'type': 'checkbox', 'sort_order': 1},
            {'label': '14h - Người kiểm tra', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 3},
        ]
    }
    
    items = []
    for row_idx in range(4, ws.max_row + 1):
        content_cell = ws.cell(row=row_idx, column=1).value
        
        if content_cell and str(content_cell).strip():
            content = str(content_cell).strip()
            # Skip header rows and section headers
            if content and not content.startswith('CHECKLIST') and content != 'NỘI DUNG':
                items.append({
                    'title': content,
                    'sort_order': len(items) + 1
                })
    
    template['groups'].append({
        'title': 'Công việc quầy bar',
        'items': items,
        'sort_order': 1
    })
    
    return template

def parse_sheet_wc(ws):
    """Parse sheet C KHANH (WC)"""
    template = {
        'name': 'Checklist Vệ Sinh WC',
        'version': 'v1',
        'description': 'Checklist kiểm tra WC theo giờ (8h-20h)',
        'groups': [],
        'columns': [
            {'label': 'Sàn', 'type': 'checkbox', 'sort_order': 1},
            {'label': 'Bệt', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'Tiểu', 'type': 'checkbox', 'sort_order': 3},
            {'label': 'Chậu rửa', 'type': 'checkbox', 'sort_order': 4},
            {'label': 'Lô giấy', 'type': 'checkbox', 'sort_order': 5},
            {'label': 'Nước rửa tay', 'type': 'checkbox', 'sort_order': 6},
            {'label': 'Vòi rửa', 'type': 'checkbox', 'sort_order': 7},
            {'label': 'Trần', 'type': 'checkbox', 'sort_order': 8},
            {'label': 'Giấy vệ sinh', 'type': 'checkbox', 'sort_order': 9},
            {'label': 'Thùng rác', 'type': 'checkbox', 'sort_order': 10},
        ]
    }
    
    # WC có các time slots từ 8h-20h, mỗi giờ là 1 item
    items = []
    hours = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    for idx, hour in enumerate(hours):
        items.append({
            'title': f'Kiểm tra lúc {hour}',
            'sort_order': idx + 1
        })
    
    template['groups'].append({
        'title': 'Lịch kiểm tra theo giờ',
        'items': items,
        'sort_order': 1
    })
    
    return template

def parse_sheet_nha_2_tang(ws):
    """Parse sheet NHÀ 2 TẦNG BÊN ĐÌNH"""
    template = {
        'name': 'Checklist Nhà 2 Tầng Bên Đình',
        'version': 'v1',
        'description': 'Checklist kiểm tra nhà 2 tầng và khu vực bảo vệ',
        'groups': [],
        'columns': [
            {'label': '08:00 - Người kiểm tra', 'type': 'checkbox', 'sort_order': 1},
            {'label': '16:00 - Người kiểm tra', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 3},
        ]
    }
    
    # Parse items by groups
    current_group = None
    groups_data = []
    
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if content_cell:
            content = str(content_cell).strip()
            
            # Check if this is a group header (Roman numerals)
            if stt_cell in ['I', 'II', 'III', 'IV', 'V']:
                if current_group:
                    groups_data.append(current_group)
                current_group = {
                    'title': content,
                    'items': [],
                    'sort_order': len(groups_data) + 1
                }
            elif current_group and content:
                current_group['items'].append({
                    'title': content,
                    'sort_order': len(current_group['items']) + 1
                })
    
    if current_group:
        groups_data.append(current_group)
    
    template['groups'] = groups_data
    return template

def parse_sheet_bep_que(ws):
    """Parse sheet BẾP QUÊ"""
    template = {
        'name': 'Checklist Bếp Quê',
        'version': 'v1',
        'description': 'Checklist kiểm tra khu bếp quê',
        'groups': [],
        'columns': [
            {'label': '09:00 - Giám sát', 'type': 'checkbox', 'sort_order': 1},
            {'label': '16:00 - Giám sát', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 3},
        ]
    }
    
    current_group = None
    groups_data = []
    
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if content_cell:
            content = str(content_cell).strip()
            
            if stt_cell in ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']:
                if current_group:
                    groups_data.append(current_group)
                current_group = {
                    'title': content,
                    'items': [],
                    'sort_order': len(groups_data) + 1
                }
            elif current_group and content:
                current_group['items'].append({
                    'title': content,
                    'sort_order': len(current_group['items']) + 1
                })
    
    if current_group:
        groups_data.append(current_group)
    
    template['groups'] = groups_data
    return template

def parse_sheet_nha_hang(ws):
    """Parse sheet THANH 2 (Nhà hàng)"""
    template = {
        'name': 'Checklist Nhà Hàng',
        'version': 'v1',
        'description': 'Checklist kiểm tra nhà hàng theo 5 ca',
        'groups': [],
        'columns': [
            {'label': '08:30 - Giám sát', 'type': 'checkbox', 'sort_order': 1},
            {'label': '10:30 - Giám sát', 'type': 'checkbox', 'sort_order': 2},
            {'label': '13:30 - Giám sát', 'type': 'checkbox', 'sort_order': 3},
            {'label': '15:00 - Giám sát', 'type': 'checkbox', 'sort_order': 4},
            {'label': '16:30 - Giám sát', 'type': 'checkbox', 'sort_order': 5},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 6},
        ]
    }
    
    current_group = None
    groups_data = []
    
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if content_cell:
            content = str(content_cell).strip()
            
            if stt_cell in ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']:
                if current_group:
                    groups_data.append(current_group)
                current_group = {
                    'title': content,
                    'items': [],
                    'sort_order': len(groups_data) + 1
                }
            elif current_group and content:
                current_group['items'].append({
                    'title': content,
                    'sort_order': len(current_group['items']) + 1
                })
    
    if current_group:
        groups_data.append(current_group)
    
    template['groups'] = groups_data
    return template

def parse_sheet_cay_xanh(ws):
    """Parse sheet CAY XANH"""
    template = {
        'name': 'Checklist Cây Xanh',
        'version': 'v1',
        'description': 'Checklist chăm sóc và kiểm tra cây xanh',
        'groups': [],
        'columns': [
            {'label': '08:00 - Người kiểm tra', 'type': 'checkbox', 'sort_order': 1},
            {'label': '08:00 - Người giám sát', 'type': 'checkbox', 'sort_order': 2},
            {'label': '17:00 - Người kiểm tra', 'type': 'checkbox', 'sort_order': 3},
            {'label': '17:00 - Người giám sát', 'type': 'checkbox', 'sort_order': 4},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 5},
        ]
    }
    
    current_group = None
    groups_data = []
    
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if content_cell:
            content = str(content_cell).strip()
            
            if stt_cell in ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']:
                if current_group:
                    groups_data.append(current_group)
                current_group = {
                    'title': content,
                    'items': [],
                    'sort_order': len(groups_data) + 1
                }
            elif current_group and content:
                current_group['items'].append({
                    'title': content,
                    'sort_order': len(current_group['items']) + 1
                })
    
    if current_group:
        groups_data.append(current_group)
    
    template['groups'] = groups_data
    return template

def insert_template_to_db(conn, template_data):
    """Insert template và các thành phần vào database"""
    cursor = conn.cursor()
    
    try:
        # 1. Insert checklist_template
        cursor.execute("""
            INSERT INTO checklist_templates (name, version, description, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, NOW(), NOW())
        """, (
            template_data['name'],
            template_data['version'],
            template_data['description'],
            1
        ))
        template_id = cursor.lastrowid
        print(f"  ✓ Created template: {template_data['name']} (ID: {template_id})")
        
        # 2. Insert template_columns
        for col in template_data['columns']:
            cursor.execute("""
                INSERT INTO template_columns (checklist_template_id, label, type, sort_order, created_at, updated_at)
                VALUES (%s, %s, %s, %s, NOW(), NOW())
            """, (
                template_id,
                col['label'],
                col['type'],
                col['sort_order']
            ))
        print(f"  ✓ Created {len(template_data['columns'])} columns")
        
        # 3. Insert groups and items
        total_items = 0
        for group_data in template_data['groups']:
            cursor.execute("""
                INSERT INTO `groups` (checklist_template_id, title, sort_order, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
            """, (
                template_id,
                group_data['title'],
                group_data['sort_order']
            ))
            group_id = cursor.lastrowid
            
            # Insert items for this group
            for item in group_data['items']:
                cursor.execute("""
                    INSERT INTO items (group_id, title, instructions, sort_order, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                """, (
                    group_id,
                    item['title'],
                    None,
                    item['sort_order']
                ))
                total_items += 1
        
        print(f"  ✓ Created {len(template_data['groups'])} groups with {total_items} items")
        
        conn.commit()
        return template_id
        
    except Exception as e:
        conn.rollback()
        print(f"  ✗ Error: {e}")
        raise

def main():
    """Main import function"""
    print("="*80)
    print("📊 IMPORT CHECKLIST TEMPLATES TỪ EXCEL VÀO DATABASE")
    print("="*80)
    
    # Load Excel file
    print(f"\n📂 Đang đọc file: {EXCEL_FILE}")
    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
    print(f"✓ Loaded {len(wb.sheetnames)} sheets")
    
    # Connect to database
    print("\n🔌 Kết nối database...")
    conn = connect_db()
    print("✓ Connected to MySQL")
    
    # Parse and import each sheet
    sheets_to_parse = [
        ('TRANG BẾP', parse_sheet_trang_bep),
        ('TRINH BAR', parse_sheet_trinh_bar),
        ('C KHANH', parse_sheet_wc),
        ('NHÀ 2 TẦNG BÊN ĐÌNH- NHUNG', parse_sheet_nha_2_tang),
        ('BẾP QUÊ - NHUNG', parse_sheet_bep_que),
        ('THANH 2', parse_sheet_nha_hang),
        ('CAY XANH', parse_sheet_cay_xanh),
    ]
    
    print("\n" + "="*80)
    print("📋 BẮT ĐẦU IMPORT TEMPLATES")
    print("="*80)
    
    template_ids = []
    for sheet_name, parser_func in sheets_to_parse:
        print(f"\n📄 Processing: {sheet_name}")
        try:
            ws = wb[sheet_name]
            template_data = parser_func(ws)
            template_id = insert_template_to_db(conn, template_data)
            template_ids.append(template_id)
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            continue
    
    conn.close()
    
    print("\n" + "="*80)
    print(f"✅ HOÀN THÀNH! Đã import {len(template_ids)} templates")
    print("="*80)
    print(f"\nTemplate IDs: {template_ids}")

if __name__ == "__main__":
    main()
