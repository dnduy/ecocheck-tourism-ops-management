
import os
import mysql.connector

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USERNAME', 'ecocheck'),
    'password': os.getenv('DB_PASSWORD', 'ecocheck_password'),
    'database': os.getenv('DB_DATABASE', 'ecocheck')
}

def check_schema():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("DESCRIBE run_signoffs")
        print(f"{'Field':<20} {'Type':<20} {'Null':<10} {'Key':<10} {'Default':<10} {'Extra':<10}")
        print("-" * 80)
        for row in cursor.fetchall():
            # handling potential None values for printing
            row_str = [str(x) if x is not None else 'NULL' for x in row]
            print(f"{row_str[0]:<20} {row_str[1]:<20} {row_str[2]:<10} {row_str[3]:<10} {row_str[4]:<10} {row_str[5]:<10}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
