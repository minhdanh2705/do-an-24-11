import React from 'react';
import { FaInfoCircle, FaPhoneAlt } from 'react-icons/fa';
// Giả định studentData được truyền vào để hiển thị thông tin
export default function BusMissingModal({ studentData, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content-bus-missing" 
        // Ngăn chặn việc đóng modal khi click vào nội dung
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="modal-header-missing">
          Chưa có xe bus
        </div>

        <div className="modal-info-text">
          Tuyến: Tuyến Sáng 01 (Quận 1 -&gt; Trường Võ Thị Sáu)
        </div>
        
        {/* Vùng Bản đồ */}
        <div className="modal-map-placeholder">
          {/* Giữ nguyên placeholder map hoặc thêm logic map */}
        </div>

        {/* Thông tin lưới */}
        <div className="modal-grid-info">
          <div>Lớp</div>
          <div>Lớp 10A1</div>
          
          <div>Học sinh</div>
          <div>Lê Hoàng C1</div>

          <div>Điểm đón</div>
          <div>Chưa có</div>
          
          <div>Thời gian</div>
          <div>1970– - 1970–</div>
        </div>

        {/* Nút hành động */}
        <div className="modal-action-buttons">
          <button className="modal-action-btn">
            ⓘ Chi tiết
          </button>
          <button className="modal-action-btn">
            📞 Gọi tài xế
          </button>
        </div>
        
        {/* Nút đóng/ẩn thông tin */}
        <button className="modal-footer-btn" onClick={onClose}>
          Ẩn thông tin
        </button>
      </div>
    </div>
  );
}