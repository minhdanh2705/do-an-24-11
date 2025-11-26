import React from 'react';

export default function NotificationItem({ title, desc, onClick }) {
  return (
    <li 
      className="notif-item"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: '10px 12px',
        borderBottom: '1px solid #333',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <strong style={{ display: 'block', marginBottom: '4px' }}>{title}</strong>
      <span style={{ fontSize: '0.875rem', color: '#aaa' }}>{desc}</span>
    </li>
  );
}
