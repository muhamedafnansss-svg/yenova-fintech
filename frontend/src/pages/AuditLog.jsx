import React, { useState, useEffect } from 'react';
import { auditService } from '../services/audit';
import { Shield, ArrowRight } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs(100);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={28} color="var(--primary)" /> Audit Log
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Transparent history of all critical system actions.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading audit logs...</div>
      ) : (
        <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem', fontWeight: 500 }}>Timestamp</th>
                <th style={{ padding: '0.75rem', fontWeight: 500 }}>User</th>
                <th style={{ padding: '0.75rem', fontWeight: 500 }}>Action</th>
                <th style={{ padding: '0.75rem', fontWeight: 500 }}>Module</th>
                <th style={{ padding: '0.75rem', fontWeight: 500 }}>Changes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 500 }}>
                    {log.user_name}
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span style={{ backgroundColor: 'var(--border)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    {log.module}
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    {log.old_values && log.new_values ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ backgroundColor: 'var(--bg-main)', padding: '0.25rem', borderRadius: '4px' }}>
                          {JSON.stringify(log.old_values)}
                        </code>
                        <ArrowRight size={14} color="var(--text-muted)" />
                        <code style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.25rem', borderRadius: '4px' }}>
                          {JSON.stringify(log.new_values)}
                        </code>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        {log.new_values ? JSON.stringify(log.new_values) : 'No values recorded'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
