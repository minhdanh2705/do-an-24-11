// ParentLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import io from "socket.io-client";
import '../styles/parent.css';

import NotificationDropdown from "./components/NotificationDropdown.jsx"; 
import MenuDropdown from "./components/MenuDropdown.jsx"; 
import useOnClickOutside from "./components/useOnClickOutside.jsx";

export default function ParentLayout({ parentId }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notices, setNotices] = useState([]); // danh sách thông báo real-time

  const notificationRef = useRef();
  const menuRef = useRef();
  useOnClickOutside(notificationRef, () => setIsNotifOpen(false));
  useOnClickOutside(menuRef, () => setIsMenuOpen(false));

  useEffect(() => {
    document.body.classList.add("parent-app-body");
    return () => document.body.classList.remove("parent-app-body");
  }, []);

  // ---- Socket.IO kết nối real-time ----
  useEffect(() => {
    if (!parentId) return; // cần parentId để nhận thông báo

    const socket = io("https://your-server.com"); // đổi URL server của bạn

    // join room riêng cho parentId
    socket.emit("joinParentRoom", parentId);

    // lắng nghe sự kiện thông báo mới
    socket.on("newNotification", (notif) => {
      setNotices(prev => [notif, ...prev]); // thêm thông báo mới lên đầu
    });

    return () => socket.disconnect();
  }, [parentId]);

  // Hàm đánh dấu thông báo đã đọc
  const markAsRead = (id) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    // gọi API nếu cần đánh dấu trên server
    fetch(`https://your-server.com/api/notifications/${id}/read`, { method: "POST" });
  };

  return (
    <div className="parent-app-shell">
      {/* Topbar */}
      <div className="parent-topbar">
        {/* Menu */}
        <div className="menu-wrapper" ref={menuRef}>
          <button 
            className="icon-btn menu-btn" 
            aria-label="menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
              <rect width="20" height="2" rx="1" fill="white"/>
              <rect y="6" width="20" height="2" rx="1" fill="white"/>
              <rect y="12" width="20" height="2" rx="1" fill="white"/>
            </svg>
          </button>
          {isMenuOpen && <MenuDropdown />}
        </div>

        {/* Title */}
        <div className="parent-title">Parent App</div>

        {/* Notification Bell */}
        <div className="notification-wrapper" ref={notificationRef}>
          <button 
            className="icon-btn bell-btn" 
            aria-label="notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 17H5v-1c0-3.1 1.6-5.8 4.3-7.1V8a3.7 3.7 0 0 1 7.4 0v.9C17.4 10.2 19 12.9 19 16v1z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* Badge hiển thị số thông báo chưa đọc */}
            {notices.length > 0 && (
              <span className="badge">{notices.length}</span>
            )}
          </button>

          {isNotifOpen && (
            <NotificationDropdown 
              notices={notices} 
              onMarkAsRead={markAsRead}
            />
          )}
        </div>
      </div>

      <div className="parent-container">
        <Outlet />
      </div>
    </div>
  );
}
