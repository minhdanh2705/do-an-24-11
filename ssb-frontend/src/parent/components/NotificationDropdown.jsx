import React from 'react';
import NotificationItem from "./NotificationItem.jsx"; 

export default function NotificationDropdown({ notices, onMarkAsRead }) {
  if (!notices || notices.length === 0) {
    return (
      <div className="notification-dropdown">
        <div className="notif-header">Thông báo</div>
        <div className="notif-empty">Không có thông báo mới</div>
      </div>
    );
  }

  return (
    <div className="notification-dropdown">
      <div className="notif-header">Thông báo</div>
      <ul className="notif-list">
        {notices.map(n => (
          <NotificationItem
            key={n.id}
            title={n.title}
            desc={n.desc}
            onClick={() => onMarkAsRead && onMarkAsRead(n.id)}
          />
        ))}
      </ul>
    </div>
  );
}
