import sqlite3

conn = sqlite3.connect('yenova.db')
c = conn.cursor()
for row in c.execute("SELECT id, transaction_number, amount, description, reference_number, category_id, project_id, created_at FROM ledger ORDER BY created_at DESC LIMIT 10"):
    print("TX:", row)

print("\n--- Audit Logs for IMPORT ---")
for row in c.execute("SELECT action, module, details FROM audit_logs WHERE action LIKE '%IMPORT%' OR module='Ledger' ORDER BY timestamp DESC LIMIT 5"):
    print("AUDIT:", row)
