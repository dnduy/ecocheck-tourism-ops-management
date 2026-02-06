#!/usr/bin/env python3
"""
Script tạo dữ liệu demo cho 1 tháng
- Tất cả checklist hoạt động hàng ngày
- Đầy đủ workflow: runs → entries → signoffs → incidents
- Lịch sử rõ ràng với timestamps
"""

import argparse
import mysql.connector
from datetime import datetime, timedelta
from calendar import monthrange
import random
import json

# Database connection
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'ecocheck',
    'password': 'ecocheck_password',
    'database': 'ecocheck'
}

# Constants (tự động lấy tháng hiện tại để dễ tái sử dụng)
TODAY = datetime.now().date()
DEFAULT_START_DATE = datetime(TODAY.year, TODAY.month, 1)  # Ngày đầu tháng hiện tại
DEFAULT_DAYS = monthrange(TODAY.year, TODAY.month)[1]      # Số ngày trong tháng hiện tại

# These will be overridden by CLI args if provided
START_DATE = DEFAULT_START_DATE
DAYS = DEFAULT_DAYS
STATUSES = ['pending', 'in_progress', 'completed', 'reviewed']
ENTRY_VALUES = ['ok', 'not_ok', 'na']
INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical']

def connect_db():
    """Kết nối MySQL database"""
    return mysql.connector.connect(**DB_CONFIG)

def get_data_from_db(conn):
    """Lấy dữ liệu cơ bản từ database"""
    cursor = conn.cursor(dictionary=True)
    
    # Get templates (lấy tất cả, sau đó map area dựa vào template nếu có)
    cursor.execute("SELECT id, area_id, name FROM checklist_templates ORDER BY id")
    templates = cursor.fetchall()
    
    # Get all groups and items
    cursor.execute("""
        SELECT g.id as group_id, g.template_id, i.id as item_id, i.content as item_title
        FROM template_groups g
        JOIN template_items i ON g.id = i.group_id
        ORDER BY g.template_id, g.sort_order, i.sort_order
    """)
    items_data = cursor.fetchall()
    
    # Get template columns
    cursor.execute("""
        SELECT id, template_id, session_id, role_id
        FROM template_columns
        ORDER BY template_id, sort_order
    """)
    columns_data = cursor.fetchall()
    
    # Get users (to rotate assignment)
    cursor.execute("SELECT id, name, role FROM users ORDER BY id")
    users = cursor.fetchall()
    
    # Get areas
    cursor.execute("SELECT * FROM areas ORDER BY id")
    areas = cursor.fetchall()

    # Get area-user mapping để phân công xoay vòng
    cursor.execute("SELECT area_id, user_id FROM area_user ORDER BY area_id, user_id")
    area_user_rows = cursor.fetchall()
    
    cursor.close()
    
    # Organize items by template
    items_by_template = {}
    for item in items_data:
        template_id = item['template_id']
        if template_id not in items_by_template:
            items_by_template[template_id] = []
        items_by_template[template_id].append(item)
    
    # Organize columns by template
    columns_by_template = {}
    for col in columns_data:
        template_id = col['template_id']
        if template_id not in columns_by_template:
            columns_by_template[template_id] = []
        columns_by_template[template_id].append(col)

    # Organize area-user mapping
    area_user_map = {}
    for row in area_user_rows:
        area_id = row['area_id']
        if area_id not in area_user_map:
            area_user_map[area_id] = []
        area_user_map[area_id].append(row['user_id'])
    
    return {
        'templates': templates,
        'items_by_template': items_by_template,
        'columns_by_template': columns_by_template,
        'users': users,
        'areas': areas,
        'area_user_map': area_user_map
    }

def map_template_to_area(template_id):
    """Map template với area phù hợp - đảm bảo mỗi area có công việc"""
    mapping = {
        7: 11,   # Bếp Chính → Khách sạn (11)
        8: 11,   # Quầy Bar → Khách sạn (11)
        9: 13,   # Vệ Sinh WC → Bảo trì (13)
        10: 10,  # Nhà 2 Tầng → Tour (10) - FIX: cho Tour có việc
        11: 12,  # Bếp Quê → Nhà hàng (12)
        12: 12,  # Nhà Hàng → Nhà hàng (12)
        13: 10,  # Cây Xanh → Tour (10) - FIX: cho Tour thêm việc
    }
    return mapping.get(template_id, 10)  # Default: Tour

def get_users_for_area(area_id, users, area_user_map):
    """Lấy users thuộc area (ưu tiên từ bảng area_user, fallback mapping cũ)"""
    fallback = {
        10: [2, 3, 4],      # Tour: 3 người
        11: [5, 6, 7],      # Khách sạn: 3 người
        12: [8, 9, 10],     # Nhà hàng: 3 người
        13: [11, 12, 13],   # Bảo trì: 3 người
    }
    if area_user_map:
        user_ids = area_user_map.get(area_id) or []
        if user_ids:
            return [u for u in users if u['id'] in user_ids]

    # Fallback cứng (theo schema cũ) nếu không có map
    user_ids = fallback.get(area_id) or []
    matched = [u for u in users if u['id'] in user_ids]
    return matched if matched else users  # Cuối cùng: dùng tất cả users có sẵn

def create_run(conn, template_id, area_id, assigned_user_id, verified_user_id, scheduled_date, status='pending'):
    """Tạo một run (phiên thực hiện checklist)"""
    cursor = conn.cursor()

    # Calculate timestamps based on status for downstream entries/signoffs
    now = datetime.now()
    created_at = scheduled_date.replace(hour=6, minute=0, second=0)
    started_at = None
    completed_at = None

    if status in ['in_progress', 'completed', 'reviewed']:
        started_at = created_at + timedelta(hours=1)

    if status in ['completed', 'reviewed']:
        completed_at = started_at + timedelta(hours=random.randint(2, 6))

    db_status = 'done' if status in ['completed', 'reviewed'] else 'open'

    cursor.execute("""
        INSERT INTO checklist_runs (
            template_id, area_id, run_date, status, work_status, assigned_to, verified_by, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        template_id, area_id, scheduled_date.date(), db_status, status,
        assigned_user_id, verified_user_id, created_at, now
    ))

    run_id = cursor.lastrowid
    cursor.close()
    return run_id, started_at, completed_at

def create_entries(conn, run_id, template_id, items, columns, assigned_user_id, started_at, completed_at):
    """Tạo entries (điền checklist) cho run"""
    cursor = conn.cursor()
    failed_items = []

    if not columns or not items:
        cursor.close()
        return failed_items

    column = columns[0]
    column_id = column['id']

    for idx, item in enumerate(items):
        item_id = item['item_id']

        rand = random.random()
        if rand < 0.85:
            value = 'ok'
        elif rand < 0.95:
            value = 'not_ok'
            failed_items.append(item)
        else:
            value = 'na'

        note = None
        if value == 'not_ok':
            notes = [
                'Chưa đạt tiêu chuẩn vệ sinh',
                'Thiết bị hư hỏng',
                'Cần bảo trì',
                'Không sạch sẽ',
                'Cần thay thế',
                'Phát hiện vấn đề'
            ]
            note = random.choice(notes)

        if started_at and completed_at:
            time_diff = (completed_at - started_at).total_seconds()
            item_offset = (time_diff / len(items)) * idx
            entry_time = started_at + timedelta(seconds=item_offset)
        else:
            entry_time = datetime.now()

        cursor.execute("""
            INSERT INTO checklist_entries (
                run_id, item_id, column_id, value, note,
                checked_by, checked_at, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            run_id, item_id, column_id, value, note,
            assigned_user_id, entry_time, entry_time, entry_time
        ))

    cursor.close()
    return failed_items

def create_signoff(conn, run_id, verified_user_id, completed_at, session_id=None, role_id=None):
    """Tạo signoff (xác nhận)"""
    if not completed_at or not session_id:
        return

    cursor = conn.cursor()

    signed_at = completed_at + timedelta(minutes=30)

    notes = [
        'Đã kiểm tra và xác nhận',
        'Công việc hoàn thành tốt',
        'Đạt yêu cầu',
        'Đã review và phê duyệt'
    ]

    cursor.execute("""
        INSERT INTO run_signoffs (
            run_id, session_id, role_id, role, user_id, signed_by, signed_at, note, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        run_id, session_id, role_id, 'supervisor', verified_user_id, verified_user_id, signed_at, random.choice(notes), signed_at, signed_at
    ))

    cursor.close()

def create_incidents(conn, run_id, area_id, failed_items, reporter_id, completed_at):
    """Tạo incidents từ failed items"""
    if not failed_items or not completed_at:
        return

    cursor = conn.cursor()

    num_incidents = min(len(failed_items), random.randint(1, 3))
    selected_items = random.sample(failed_items, num_incidents)

    for item in selected_items:
        severity = random.choice(['low', 'medium', 'high'])

        rand = random.random()
        if rand < 0.7:
            status = 'resolved'
        elif rand < 0.9:
            status = 'in_progress'
        else:
            status = 'open'

        title = f"Sự cố: {item['item_title']}"
        description = f"Phát hiện vấn đề tại {item['item_title']}. Cần xử lý ngay."

        occurred_at = completed_at + timedelta(minutes=random.randint(5, 30))
        resolution_note = None

        if status == 'resolved':
            resolution_note = 'Đã khắc phục sự cố'

        cursor.execute("""
            INSERT INTO incidents (
                area_id, run_id, title, description, severity, status,
                assigned_to, resolution_note, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            area_id, run_id, title, description, severity, status,
            reporter_id, resolution_note, occurred_at, occurred_at
        ))

    cursor.close()

def generate_demo_data():
    """Main function: Generate dữ liệu demo cho 1 tháng"""
    print("="*80)
    print("🚀 GENERATING DEMO DATA FOR 1 MONTH")
    print("="*80)
    
    conn = connect_db()
    print("✓ Connected to database")
    
    # Get base data
    data = get_data_from_db(conn)
    templates = data['templates']
    items_by_template = data['items_by_template']
    columns_by_template = data['columns_by_template']
    users = data['users']
    areas = data['areas']
    area_user_map = data['area_user_map']
    
    print(f"\n📊 Base data:")
    print(f"  - Templates: {len(templates)}")
    print(f"  - Users: {len(users)}")
    print(f"  - Areas: {len(areas)}")
    print(f"  - Range:   {START_DATE.strftime('%Y-%m-%d')} for {DAYS} days")
    
    # Clear existing demo runs (keep only first 6 to avoid touching user data)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM run_signoffs WHERE run_id > 6")
    cursor.execute("DELETE FROM incidents WHERE run_id > 6")
    cursor.execute("DELETE FROM checklist_entries WHERE run_id > 6")
    cursor.execute("DELETE FROM checklist_runs WHERE id > 6")
    conn.commit()
    cursor.close()
    print("\n✓ Cleared old demo data (checklist_runs > 6)")
    
    print(f"\n🏗️  Generating data for {DAYS} days...")
    print("-"*80)
    
    total_runs = 0
    total_entries = 0
    total_signoffs = 0
    total_incidents = 0
    
    # Chỉ số xoay vòng phân công theo area để mỗi nhân sự đều có việc
    area_assignment_index = {}

    # Generate cho mỗi ngày
    for day in range(DAYS):
        current_date = START_DATE + timedelta(days=day)
        print(f"\n📅 Day {day+1}/{DAYS}: {current_date.strftime('%Y-%m-%d')}")
        
        day_runs = 0
        created_for_area = set()
        
        # Tạo runs cho mỗi template
        for template in templates:
            template_id = template['id']
            template_name = template['name']

            # Ưu tiên area gắn với template, fallback mapping cứng
            area_id = template.get('area_id') or map_template_to_area(template_id)
            if not any(a['id'] == area_id for a in areas) and areas:
                area_id = areas[0]['id']
            if not area_id:
                continue

            # Chỉ tạo 1 run mỗi area mỗi ngày (unique constraint)
            if area_id in created_for_area:
                continue
            
            # Get users cho area này
            area_users = get_users_for_area(area_id, users, area_user_map)
            if len(area_users) < 2:
                continue
            
            # Xoay vòng để mọi người đều được phân việc trong tháng
            last_idx = area_assignment_index.get(area_id, -1)
            next_idx = (last_idx + 1) % len(area_users)
            assigned_user = area_users[next_idx]
            area_assignment_index[area_id] = next_idx

            # Người xác nhận khác người thực hiện nếu có thể
            verified_user = area_users[(next_idx + 1) % len(area_users)] if len(area_users) > 1 else assigned_user
            
            # Random status dựa vào ngày - tối ưu cho demo thực tế
            # Quá khứ xa (>5 ngày): 90% reviewed, 10% completed
            # Quá khứ gần (2-5 ngày): 50% reviewed, 30% completed, 20% in_progress
            # Hôm qua: 40% completed, 30% in_progress, 30% pending
            # Hôm nay: 100% pending (để staff có việc làm)
            # Tương lai: 100% pending
            days_ago = (datetime.now().date() - current_date.date()).days
            
            if days_ago > 5:
                status = 'reviewed' if random.random() < 0.9 else 'completed'
            elif days_ago > 1:
                rand = random.random()
                if rand < 0.5:
                    status = 'reviewed'
                elif rand < 0.8:
                    status = 'completed' # Will map to 'completed' or 'needs_review'
                else:
                    status = 'in_progress'
            elif days_ago == 1:
                rand = random.random()
                if rand < 0.4:
                    status = 'completed'
                elif rand < 0.7:
                    status = 'in_progress'
                else:
                    status = 'pending'
            else:
                # Hôm nay và tương lai: tất cả pending để staff có thể làm việc
                status = 'pending'
            
            # specific mapping for demo:
            # internal 'reviewed' -> DB work_status 'approved'
            # internal 'completed' -> DB work_status 'needs_review' (to show in manager queue)
            # internal 'in_progress' -> DB work_status 'in_progress'
            # internal 'pending' -> DB work_status 'pending'
            
            db_work_status = status
            if status == 'reviewed':
                db_work_status = 'approved'
            elif status == 'completed':
                db_work_status = 'needs_review'
            
            # Create run
            run_id, started_at, completed_at = create_run(
                conn, template_id, area_id,
                assigned_user['id'], verified_user['id'],
                current_date, db_work_status
            )
            total_runs += 1
            day_runs += 1
            created_for_area.add(area_id)
            
            # Create entries if status != pending
            failed_items = []
            if status != 'pending':
                items = items_by_template.get(template_id, [])
                columns = columns_by_template.get(template_id, [])
                
                failed_items = create_entries(
                    conn, run_id, template_id, items, columns,
                    assigned_user['id'], started_at, completed_at
                )
                total_entries += len(items) if columns else 0
            
            # Create signoff if status == reviewed
            if status == 'reviewed' and completed_at:
                columns = columns_by_template.get(template_id, [])
                session_id = columns[0]['session_id'] if columns else None
                role_id = columns[0]['role_id'] if columns else None
                create_signoff(conn, run_id, verified_user['id'], completed_at, session_id, role_id)
                total_signoffs += 1
            
            # Create incidents from failed items
            if failed_items and completed_at:
                num_incidents = len(failed_items)
                create_incidents(
                    conn, run_id, area_id, failed_items,
                    assigned_user['id'], completed_at
                )
                total_incidents += num_incidents
        
        print(f"  ✓ Created {day_runs} runs")
        
        # Commit every day
        conn.commit()
    
    conn.close()
    
    print("\n" + "="*80)
    print("✅ DEMO DATA GENERATION COMPLETED!")
    print("="*80)
    print(f"\n📊 Summary:")
    print(f"  - Total Runs:      {total_runs}")
    print(f"  - Total Entries:   {total_entries}")
    print(f"  - Total Signoffs:  {total_signoffs}")
    print(f"  - Total Incidents: {total_incidents}")
    print(f"\n🎉 All done! Data is ready for {DAYS} days.")
    print("="*80)

def parse_args():
    parser = argparse.ArgumentParser(description="Generate demo data for EcoCheck")
    parser.add_argument("--start-date", dest="start_date", help="Start date YYYY-MM-DD (default: first day of current month)")
    parser.add_argument("--days", dest="days", type=int, help="Number of days to generate (default: full current month)")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()

    # Override globals based on CLI input
    if args.start_date:
        START_DATE = datetime.strptime(args.start_date, "%Y-%m-%d")
    if args.days:
        DAYS = args.days

    generate_demo_data()
