import React from "react";
import StudentCard from "./StudentCard.jsx";

const studentsMock = [
  {
    id: 1,
    name: "HS1",
    className: "Lớp 3C",
    status: "onboard",
    statusLabel: "Đang trên xe",
    busPlate: "29B-12345",
    pickupTime: "07:15",
    eta: "15 phút",
    busName: "Xe buýt 29A-12345",
    busTutor: "TX001",
    currentLocation: "123 abc",
    speed: "40 km/h",
    distance: "2.5 km",
    busStatusLabel: "Đang di chuyển",
  },
  {
    id: 2,
    name: "HS2",
    className: "Lớp 3C",
    status: "arrived",
    statusLabel: "Đã đến trường",
    busPlate: "29B-12345",
    pickupTime: "07:15",
    eta: "15 phút",
  },
  {
    id: 3,
    name: "Lê Hoàng C1",
    className: "Lớp 10A1",
    status: "missing_bus",
    busPlate: "Chưa có",
    pickupTime: "1970–",
    eta: "1970–",
  }
];

export default function ParentHome() {
  return (
    <div className="parent-home">
      <div className="greeting">
        <h2>Xin chào, Lê Văn C</h2>
        <div className="sub">Thứ Ba, 30 tháng 9, 2025</div>
      </div>

      <div className="section-title">Con của bạn</div>

      <StudentCard student={studentsMock[0]} isInitiallyExpanded={true} />
      <StudentCard student={studentsMock[1]} />
      <StudentCard student={studentsMock[2]} />
    </div>
  );
}
