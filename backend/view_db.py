import sqlite3
import os

# Get path relative to the script location
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "irrigation.db")

if not os.path.exists(db_path):
    print(f"Error: Database file not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]

print(f"Database: {db_path}")
print(f"Tables: {', '.join(tables)}")

for table in tables:
    print("\n" + "=" * 60)
    print(f"TABLE: {table}")
    print("=" * 60)
    cursor.execute(f"SELECT * FROM [{table}]")
    rows = cursor.fetchall()
    if not rows:
        print("  (Empty Table)")
        continue
    
    columns = [desc[0] for desc in cursor.description]
    print(f"Columns: {', '.join(columns)}")
    print(f"Total Rows: {len(rows)}")
    
    for i, row in enumerate(rows):
        print(f"\n  Row {i + 1}:")
        for col in columns:
            val = row[col]
            if isinstance(val, str) and len(val) > 150:
                val = val[:150] + "..."
            print(f"    {col}: {val}")

conn.close()
