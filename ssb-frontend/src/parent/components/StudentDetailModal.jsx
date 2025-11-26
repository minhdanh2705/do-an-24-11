import React from "react";
import { FaPhoneAlt, FaInfoCircle } from "react-icons/fa";


const mockRoute = "Tuyến Sáng 01 (Quận 1 -> Trường Võ Thị Sáu)";

export default function StudentDetailModal({ student, onClose }) {
  // Hàm gọi tài xế
  const handleCallDriver = () => {
    const phone = student.driverPhone || "0901234567";
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-large">
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="modal-header-info">
          <h3 className="modal-title-status">Chưa có xe bus</h3> 
          <div className="modal-route-info">
            Tuyến: {mockRoute}
          </div>
        </div>

        <div className="map-placeholder map-modal">
            <img 
                src="https://images.unsplash.com/photo-1549488344-93444744d014?w=800" 
                alt="Map Placeholder" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
        </div>
        
        <div className="student-detail-grid modal-grid-full">
          <div><strong>Lớp:</strong></div>
          <div>{student.className}</div>

          <div><strong>Học sinh:</strong></div>
          <div>{student.name}</div>

          <div><strong>Điểm đón:</strong></div>
          <div>Chưa có</div>

          <div><strong>Thời gian:</strong></div>
          <div>1970 - 1970</div>
        </div>
        <div className="modal-action-buttons">
          <button className="action-btn modal-btn-primary">
            <FaInfoCircle size={16} /> Chi tiết
          </button>
          <button className="action-btn modal-btn-secondary" onClick={handleCallDriver}>
            <FaPhoneAlt size={16} /> Gọi tài xế
          </button>
        </div>

        <button className="view-details-btn hide-modal-btn" onClick={onClose}>
            Ẩn thông tin
        </button>

      </div>
    </div>
  );
}