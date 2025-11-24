// MenuDropdown.jsx
import React from 'react';

export default function MenuDropdown() {
  const handleLogout = () => {
    console.log("Đang đăng xuất...");
    // Thêm logic đăng xuất (xóa token, điều hướng)
  };

  return (
    <div className="menu-dropdown">
      <a href="/parent/profile" className="menu-item">
        Hồ sơ
      </a>
      <button onClick={handleLogout} className="menu-item menu-item-logout">
        Đăng xuất
      </button>
    </div>
  );
}