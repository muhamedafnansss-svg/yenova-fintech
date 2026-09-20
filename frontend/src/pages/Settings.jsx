import React from 'react';

const Settings = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>System Settings</h1>
      
      <div className="card">
        <h3>General Settings</h3>
        <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>Manage your application preferences and settings.</p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ margin: 0 }}>Dark Mode</h4>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Toggle dark mode appearance (Coming soon)</p>
          </div>
          <div style={{ width: '44px', height: '24px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', position: 'relative', cursor: 'not-allowed' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
          <div>
            <h4 style={{ margin: 0 }}>Email Notifications</h4>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Receive updates via email (Coming soon)</p>
          </div>
          <div style={{ width: '44px', height: '24px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', position: 'relative', cursor: 'not-allowed' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
