#!/usr/bin/env python3
"""
Script import checklist templates từ file Excel 2026 vào MySQL database
CHECK LIST CÁC BỘ PHẬN KS CHIC 2026.xlsx
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

EXCEL_FILE = "CHECK LIST CÁC BỘ PHẬN KS CHIC 2026.xlsx"

def connect_db():
    """Kết nối MySQL database"""
    return mysql.connector.connect(**DB_CONFIG)

def parse_sheet_bao_tri(ws):
    """Parse sheet 'Bảo trì 5.12' - Maintenance checklist"""
    template = {
        'name': 'Checklist Bảo Trì Định Kỳ 2026',
        'version': 'v1',
        'description': 'Checklist bảo trì và kiểm tra định kỳ các thiết bị khách sạn',
        'groups': [],
        'columns': [
            {'label': 'Số lượng', 'type': 'text', 'sort_order': 1},
            {'label': 'Tình trạng', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 3},
        ]
    }
    
    items = []
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if stt_cell and str(stt_cell).strip().isdigit() and content_cell:
            items.append({
                'title': str(content_cell).strip(),
                'sort_order': int(stt_cell)
            })
    
    template['groups'].append({
        'title': 'Danh mục thiết bị cần bảo trì',
        'items': items,
        'sort_order': 1
    })
    
    return template

def parse_sheet_wc_lt(ws):
    """Parse sheet 'WC LT 5.12' - Public toilet & garden cleaning checklist"""
    template = {
        'name': 'Checklist Vệ Sinh WC Công Cộng 2026',
        'version': 'v1',
        'description': 'Checklist vệ sinh WC công cộng khu lễ tân và nhà hàng',
        'groups': [],
        'columns': [
            {'label': 'WC Nam - Lễ Tân', 'type': 'checkbox', 'sort_order': 1},
            {'label': 'WC Nam - Nhà Hàng', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'WC Nữ - Lễ Tân', 'type': 'checkbox', 'sort_order': 3},
            {'label': 'WC Nữ - Nhà Hàng', 'type': 'checkbox', 'sort_order': 4},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 5},
        ]
    }
    
    # Time-based items
    items = []
    time_slots = ['08h', '10h', '13h', '16h30']
    for idx, time in enumerate(time_slots):
        items.append({
            'title': f'Kiểm tra lúc {time}',
            'sort_order': idx + 1
        })
    
    template['groups'].append({
        'title': 'Lịch kiểm tra theo giờ',
        'items': items,
        'sort_order': 1
    })
    
    return template

def parse_sheet_hang_ngay_le_tan(ws):
    """Parse sheet 'hang ngay le tan' - Daily reception area cleaning"""
    template = {
        'name': 'Checklist Vệ Sinh Hàng Ngày Lễ Tân 2026',
        'version': 'v1',
        'description': 'Checklist vệ sinh hàng ngày khu vực lễ tân và trước lễ tân',
        'groups': [],
        'columns': [
            {'label': 'Thời gian bắt đầu (Ca 1)', 'type': 'text', 'sort_order': 1},
            {'label': 'Thời gian kết thúc (Ca 1)', 'type': 'text', 'sort_order': 2},
            {'label': 'Thời gian bắt đầu (Ca 2)', 'type': 'text', 'sort_order': 3},
            {'label': 'Thời gian kết thúc (Ca 2)', 'type': 'text', 'sort_order': 4},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 5},
        ]
    }
    
    items = []
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if stt_cell and str(stt_cell).strip().isdigit() and content_cell:
            items.append({
                'title': str(content_cell).strip(),
                'sort_order': int(stt_cell)
            })
    
    template['groups'].append({
        'title': 'Công việc vệ sinh khu lễ tân',
        'items': items,
        'sort_order': 1
    })
    
    return template

def parse_sheet_nha_hang(ws):
    """Parse sheet 'nha hang' - Restaurant area cleaning (very detailed)"""
    template = {
        'name': 'Checklist Vệ Sinh Nhà Hàng 2026',
        'version': 'v1',
        'description': 'Checklist vệ sinh và cây xanh hàng ngày khu vực nhà hàng',
        'groups': [],
        'columns': [
            {'label': 'Đầu ca', 'type': 'checkbox', 'sort_order': 1},
            {'label': 'Hết ăn sáng', 'type': 'checkbox', 'sort_order': 2},
            {'label': '13h00', 'type': 'checkbox', 'sort_order': 3},
            {'label': '15h00', 'type': 'checkbox', 'sort_order': 4},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 5},
        ]
    }
    
    items = []
    current_group = None
    groups_data = []
    
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if content_cell:
            content = str(content_cell).strip()
            
            # Check for section headers (uppercase, longer text, or Roman numerals)
            if stt_cell and stt_cell in ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']:
                # This is a group header
                if current_group and current_group['items']:
                    groups_data.append(current_group)
                current_group = {
                    'title': content,
                    'items': [],
                    'sort_order': len(groups_data) + 1
                }
            elif stt_cell and str(stt_cell).strip().isdigit() and content:
                # This is a regular item
                if not current_group:
                    current_group = {
                        'title': 'Công việc chung',
                        'items': [],
                        'sort_order': 1
                    }
                current_group['items'].append({
                    'title': content,
                    'sort_order': len(current_group['items']) + 1
                })
    
    # Add last group
    if current_group and current_group['items']:
        groups_data.append(current_group)
    
    # If no groups found, create one default group
    if not groups_data:
        items = []
        for row_idx in range(6, ws.max_row + 1):
            stt_cell = ws.cell(row=row_idx, column=1).value
            content_cell = ws.cell(row=row_idx, column=2).value
            
            if stt_cell and str(stt_cell).strip().isdigit() and content_cell:
                items.append({
                    'title': str(content_cell).strip(),
                    'sort_order': int(stt_cell)
                })
        
        groups_data.append({
            'title': 'Công việc vệ sinh nhà hàng',
            'items': items,
            'sort_order': 1
        })
    
    template['groups'] = groups_data
    return template

def parse_sheet_bao_ve(ws):
    """Parse sheet 'bao ve 24.12' - Security area checklist"""
    template = {
        'name': 'Checklist Khu Vực Bảo Vệ 2026',
        'version': 'v1',
        'description': 'Checklist vệ sinh các khu vực bảo vệ và khu vực công cộng',
        'groups': [],
        'columns': [
            {'label': 'Tình trạng', 'type': 'checkbox', 'sort_order': 1},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 2},
        ]
    }
    
    items = []
    for row_idx in range(4, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if stt_cell and str(stt_cell).strip().isdigit() and content_cell:
            items.append({
                'title': str(content_cell).strip(),
                'sort_order': int(stt_cell)
            })
    
    template['groups'].append({
        'title': 'Khu vực làm việc',
        'items': items,
        'sort_order': 1
    })
    
    return template

def parse_sheet_khu_2_3_tang(ws):
    """Parse sheet 'khu 2 tang, 3 tang' - 2-3 floor area cleaning & garden"""
    template = {
        'name': 'Checklist Vệ Sinh Khu 2-3 Tầng 2026',
        'version': 'v1',
        'description': 'Checklist vệ sinh và tình trạng cây xanh khu vực 2-3 tầng',
        'groups': [],
        'columns': [
            {'label': 'Thời gian kiểm tra', 'type': 'text', 'sort_order': 1},
            {'label': 'OK', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'NOT OK', 'type': 'checkbox', 'sort_order': 3},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 4},
        ]
    }
    
    current_group = None
    groups_data = []
    
    for row_idx in range(5, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if content_cell:
            content = str(content_cell).strip()
            
            # Check if this is a group header (Roman numerals)
            if stt_cell in ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']:
                if current_group and current_group['items']:
                    groups_data.append(current_group)
                current_group = {
                    'title': content,
                    'items': [],
                    'sort_order': len(groups_data) + 1
                }
            elif current_group and stt_cell and str(stt_cell).strip().isdigit():
                current_group['items'].append({
                    'title': content,
                    'sort_order': len(current_group['items']) + 1
                })
    
    if current_group and current_group['items']:
        groups_data.append(current_group)
    
    template['groups'] = groups_data
    return template

def parse_sheet_phong(ws):
    """Parse sheet 'phong' - Room inspection checklist"""
    template = {
        'name': 'Checklist Kiểm Tra Phòng 2026',
        'version': 'v1',
        'description': 'Checklist kiểm tra trang thiết bị và tình trạng phòng khách',
        'groups': [],
        'columns': [
            {'label': 'OK', 'type': 'checkbox', 'sort_order': 1},
            {'label': 'NOT OK', 'type': 'checkbox', 'sort_order': 2},
            {'label': 'Ghi chú', 'type': 'text', 'sort_order': 3},
        ]
    }
    
    items = []
    for row_idx in range(5, ws.max_row + 1):
        stt_cell = ws.cell(row=row_idx, column=1).value
        content_cell = ws.cell(row=row_idx, column=2).value
        
        if stt_cell and str(stt_cell).strip().isdigit() and content_cell:
            items.append({
                'title': str(content_cell).strip(),
                'sort_order': int(stt_cell)
            })
    
    template['groups'].append({
        'title': 'Danh mục kiểm tra phòng',
        'items': items,
        'sort_order': 1
    })
    
    return template

def get_or_create_area(conn, area_name):
    """Get existing area or create new one"""
    cursor = conn.cursor()
    
    # Check if area exists
    cursor.execute("SELECT id FROM areas WHERE name = %s", (area_name,))
    result = cursor.fetchone()
    
    if result:
        return result[0]
    
    # Create new area
    cursor.execute("""
        INSERT INTO areas (name, created_at, updated_at)
        VALUES (%s, NOW(), NOW())
    """, (area_name,))
    area_id = cursor.lastrowid
    conn.commit()
    return area_id

def insert_template_to_db(conn, template_data, area_name):
    """Insert template và các thành phần vào database"""
    cursor = conn.cursor()
    
    try:
        # 0. Get or create area
        area_id = get_or_create_area(conn, area_name)
        
        # 1. Insert checklist_template
        # Note: Database schema has area_id, orientation, not version/description
        # We'll use orientation='vertical' as default
        cursor.execute("""
            INSERT INTO checklist_templates (area_id, name, orientation, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, NOW(), NOW())
        """, (
            area_id,
            template_data['name'],
            'vertical',  # default orientation
            1
        ))
        template_id = cursor.lastrowid
        print(f"  ✓ Created template: {template_data['name']} (ID: {template_id}, Area: {area_name})")
        
        # 2. Insert groups and items
        # Note: Skipping template_columns - it's for session/role configuration, not column definitions
        total_items = 0
        for group_data in template_data['groups']:
            cursor.execute("""
                INSERT INTO template_groups (template_id, title, sort_order, created_at, updated_at)
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
                    INSERT INTO template_items (template_id, group_id, content, sort_order, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, NOW(), NOW())
                """, (
                    template_id,
                    group_id,
                    item['title'],
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
    print("📊 IMPORT CHECKLIST TEMPLATES 2026 TỪ EXCEL VÀO DATABASE")
    print("="*80)
    
    # Load Excel file
    print(f"\n📂 Đang đọc file: {EXCEL_FILE}")
    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
    print(f"✓ Loaded {len(wb.sheetnames)} sheets: {wb.sheetnames}")
    
    # Connect to database
    print("\n🔌 Kết nối database...")
    conn = connect_db()
    print("✓ Connected to MySQL")
    
    # Parse and import each sheet with appropriate area
    # Format: (sheet_name, parser_func, area_name)
    sheets_to_parse = [
        ('Bảo trì 5.12', parse_sheet_bao_tri, 'Bảo trì'),
        ('WC LT 5.12', parse_sheet_wc_lt, 'Vệ sinh (WC)'),
        ('hang ngay le tan', parse_sheet_hang_ngay_le_tan, 'Lễ tân'),
        ('nha hang', parse_sheet_nha_hang, 'Nhà hàng'),
        ('bao ve 24.12', parse_sheet_bao_ve, 'Bảo vệ'),
        ('khu 2 tang, 3 tang', parse_sheet_khu_2_3_tang, 'Tầng 2-3'),
        ('phong', parse_sheet_phong, 'Phòng khách'),
    ]
    
    print("\n" + "="*80)
    print("📋 BẮT ĐẦU IMPORT TEMPLATES")
    print("="*80)
    
    template_ids = []
    for sheet_name, parser_func, area_name in sheets_to_parse:
        print(f"\n📄 Processing: {sheet_name}")
        try:
            ws = wb[sheet_name]
            template_data = parser_func(ws)
            template_id = insert_template_to_db(conn, template_data, area_name)
            template_ids.append(template_id)
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    conn.close()
    
    print("\n" + "="*80)
    print(f"✅ HOÀN THÀNH! Đã import {len(template_ids)} templates")
    print("="*80)
    print(f"\nTemplate IDs: {template_ids}")
    print("\n💡 Tiếp theo: Chạy verification commands để kiểm tra kết quả")

if __name__ == "__main__":
    main()

