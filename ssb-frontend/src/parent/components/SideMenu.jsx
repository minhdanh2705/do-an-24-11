import React from 'react';
import './parent.css';

export default function SideMenu({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  const handleLogout = () => {
    console.log("Đang đăng xuất...");
    onClose(); 
  };

  return (
    <>
      <div className="sidemenu-overlay" onClick={onClose}></div>
      
      <aside className="sidemenu-nav">
        <a href="/parent/profile" className="nav-link">
          Hồ sơ
        </a>
        
        <button onClick={handleLogout} className="nav-link logout-btn">
          Đăng xuất
        </button>
      </aside>
    </>
  );
}