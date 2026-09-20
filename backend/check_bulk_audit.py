import sqlite3

conn = sqlite3.connect('yenova.db')
c = conn.cursor()
rows = c.execute("SELECT * FROM audit_logs WHERE action='BULK_IMPORT_EXCEL' ORDER BY timestamp DESC LIMIT 3").fetchall()
for r in rows:
    print(r)
