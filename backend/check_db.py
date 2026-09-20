import sqlite3

conn = sqlite3.connect('yenova.db')
c = conn.cursor()
cols = [d[0] for d in c.execute("PRAGMA table_info(audit_logs)").fetchall()]
print("Audit log columns:", cols)

logs = c.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 15").fetchall()
for log in logs:
    print(dict(zip(cols, log)))
