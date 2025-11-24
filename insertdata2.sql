/*
================================================================================
TẬP DỮ LIỆU MẪU CHO CSDL QUẢN LÝ XE BUS (CNPM)
================================================================================
Thứ tự chèn dữ liệu:
1.  Bảng không có khóa ngoại (Danh mục cơ bản):
    - DIEMDUNG
    - TUYENDUONG
    - XEBUS
    - TAIXE
    - PHUHUYNH
    - QUANLY
2.  Bảng phụ thuộc cấp 1:
    - TUYENDUONG_DIEMDUNG (Phụ thuộc: TUYENDUONG, DIEMDUNG)
    - HOCSINH (Phụ thuộc: TUYENDUONG, DIEMDUNG)
    - TAIKHOAN (Phụ thuộc: PHUHUYNH, TAIXE, QUANLY)
3.  Bảng phụ thuộc cấp 2:
    - PHUHUYNH_HOCSINH (Phụ thuộc: PHUHUYNH, HOCSINH)
    - LICHTRINH (Phụ thuộc: TAIXE, XEBUS, QUANLY, TUYENDUONG)
4.  Bảng phụ thuộc cấp 3:
    - DIEMDANH (Phụ thuộc: LICHTRINH, HOCSINH)
================================================================================
*/
USE CNPM;
GO
SET DATEFORMAT dmy; -- Đặt định dạng ngày tháng là Day-Month-Year
GO

-- ==============================
-- 1.1) DIEMDUNG (Bảng này không có IDENTITY, phải chèn ID thủ công)
-- ==============================
PRINT N'Chèn dữ liệu DIEMDUNG...';
INSERT INTO dbo.DIEMDUNG (idDiemDung, kinhDo, viDo, tenDiemDung)
VALUES
(1, 10.7769, 106.6954, N'Nhà Thờ Đức Bà'),
(2, 10.7750, 106.6950, N'Dinh Độc Lập'),
(3, 10.7795, 106.6940, N'Bưu điện Thành phố'),
(4, 10.7723, 106.6983, N'Chợ Bến Thành'),
(5, 10.7845, 106.6826, N'Trường THPT Võ Thị Sáu (Điểm trường)'),
(6, 10.7850, 106.6990, N'Trường THCS Hai Bà Trưng (Điểm trường)'),
(7, 10.7900, 106.6900, N'Ngã tư Phú Nhuận');
GO

-- ==============================
-- 1.2) TUYENDUONG
-- ==============================
PRINT N'Chèn dữ liệu TUYENDUONG...';
INSERT INTO dbo.TUYENDUONG (tenTuyen, gioBatDau, gioKetThuc)
VALUES
(N'Tuyến Sáng 01 (Quận 1 -> Trường Võ Thị Sáu)', '06:00:00', '07:00:00'),
(N'Tuyến Chiều 01 (Trường Võ Thị Sáu -> Quận 1)', '16:30:00', '17:30:00'),
(N'Tuyến Sáng 02 (Quận Phú Nhuận -> Trường Hai Bà Trưng)', '06:15:00', '07:15:00');
GO
-- ID Tuyến 1, 2, 3 sẽ được tự động tạo

-- ==============================
-- 1.3) XEBUS
-- ==============================
PRINT N'Chèn dữ liệu XEBUS...';
INSERT INTO dbo.XEBUS (bienSo, sucChua, trangThai)
VALUES
(N'51B-123.45', 30, 1), -- ID Xe 1
(N'51B-678.90', 45, 1), -- ID Xe 2
(N'51B-111.22', 30, 0); -- ID Xe 3 (Bảo trì)
GO

-- ==============================
-- 1.4) TAIXE
-- ==============================
PRINT N'Chèn dữ liệu TAIXE...';
INSERT INTO dbo.TAIXE (hoTen, soDienThoai, email, trangThai)
VALUES
(N'Nguyễn Văn A', '0901234567', N'vana@gmail.com', 1), -- ID Tài xế 1
(N'Trần Thị B', '0912345678', N'thib@gmail.com', 1); -- ID Tài xế 2
GO

-- ==============================
-- 1.5) PHUHUYNH
-- ==============================
PRINT N'Chèn dữ liệu PHUHUYNH...';
INSERT INTO dbo.PHUHUYNH (hoTen, soDienThoai, email, trangThai)
VALUES
(N'Lê Văn C', '0987654321', N'vanc@gmail.com', 1), -- ID PH 1
(N'Phạm Thị D', '0987654322', N'thid@gmail.com', 1), -- ID PH 2
(N'Hoàng Văn E', '0987654323', N'vane@gmail.com', 1); -- ID PH 3
GO

-- ==============================
-- 1.6) QUANLY
-- ==============================
PRINT N'Chèn dữ liệu QUANLY...';
INSERT INTO dbo.QUANLY (hoTen, email, trangThai)
VALUES
(N'Admin Quản Lý', N'admin@school.edu.vn', 1); -- ID QL 1
GO

-- ==============================
-- 2.1) TUYENDUONG_DIEMDUNG (Giả sử ID Tuyến là 1, 2, 3)
-- ==============================
PRINT N'Chèn dữ liệu TUYENDUONG_DIEMDUNG...';
INSERT INTO dbo.TUYENDUONG_DIEMDUNG (idTuyenDuong, idDiemDung, thuTu)
VALUES
-- Tuyến 1 (Sáng): Dừng ở điểm 1, 2, 3 và kết thúc ở 5 (Trường VTS)
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
(1, 5, 4),
-- Tuyến 2 (Chiều): Bắt đầu ở 5 (Trường VTS) và trả ở 3, 2, 1
(2, 5, 1),
(2, 3, 2),
(2, 2, 3),
(2, 1, 4),
-- Tuyến 3 (Sáng): Dừng ở 4, 7 và kết thúc ở 6 (Trường HBT)
(3, 4, 1),
(3, 7, 2),
(3, 6, 3);
GO

-- ==============================
-- 2.2) HOCSINH (Giả sử ID Tuyến là 1, 2, 3)
-- ==============================
PRINT N'Chèn dữ liệu HOCSINH...';
INSERT INTO dbo.HOCSINH (hoTen, lop, ngaySinh, noiSinh, idTuyen, diemDon, trangThai)
VALUES
-- Học sinh đi tuyến 1
(N'Lê Hoàng C1', N'Lớp 10A1', '15/01/2014', N'TP.HCM', 1, 1, 1), -- ID HS 1 (Đón ở Nhà Thờ)
(N'Phạm Bảo D1', N'Lớp 11B2', '20/05/2013', N'Đồng Nai', 1, 2, 1), -- ID HS 2 (Đón ở Dinh)
(N'Lê Thảo C2', N'Lớp 6A1', '01/03/2018', N'TP.HCM', 1, 1, 1), -- ID HS 3 (Đón ở Nhà Thờ)
-- Học sinh đi tuyến 3
(N'Hoàng Minh E1', N'Lớp 12C3', '10/10/2012', N'TP.HCM', 3, 4, 1); -- ID HS 4 (Đón ở Bến Thành)
GO

-- ==============================
-- 2.3) TAIKHOAN (Giả sử ID của PH, TX, QL là 1, 2, 3...)
-- ==============================
PRINT N'Chèn dữ liệu TAIKHOAN...';
INSERT INTO dbo.TAIKHOAN (taiKhoan, matKhau, trangThai, vaiTro, idPhuHuynh, idTaiXe, idQuanLy)
VALUES
(N'phuhuynh_c', N'pass123', 1, N'PHU_HUYNH', 1, NULL, NULL), -- TK cho PH 1 (Lê Văn C)
(N'phuhuynh_d', N'pass123', 1, N'PHU_HUYNH', 2, NULL, NULL), -- TK cho PH 2 (Phạm Thị D)
(N'phuhuynh_e', N'pass123', 1, N'PHU_HUYNH', 3, NULL, NULL), -- TK cho PH 3 (Hoàng Văn E)
(N'taixe_a', N'pass123', 1, N'TAI_XE', NULL, 1, NULL), -- TK cho TX 1 (Nguyễn Văn A)
(N'taixe_b', N'pass123', 1, N'TAI_XE', NULL, 2, NULL), -- TK cho TX 2 (Trần Thị B)
(N'admin', N'pass123', 1, N'QUAN_LY', NULL, NULL, 1); -- TK cho QL 1 (Admin)
GO

-- ==============================
-- 3.1) PHUHUYNH_HOCSINH (Giả sử ID PH 1,2,3; HS 1,2,3,4)
-- ==============================
PRINT N'Chèn dữ liệu PHUHUYNH_HOCSINH...';
INSERT INTO dbo.PHUHUYNH_HOCSINH (idPhuHuynh, idHocSinh)
VALUES
(1, 1), -- PH 'C' là cha của HS 'C1'
(1, 3), -- PH 'C' cũng là cha của HS 'C2'
(2, 2), -- PH 'D' là cha của HS 'D1'
(3, 4); -- PH 'E' là cha của HS 'E1'
GO

-- ==============================
-- 3.2) LICHTRINH
-- ==============================
PRINT N'Chèn dữ liệu LICHTRINH...';
INSERT INTO dbo.LICHTRINH (idTaiXe, idXe, idQuanLy, ngayThucHien, gioBatDau, trangThai, kinhDo, viDo, idTuyen)
VALUES
-- Chuyến sáng nay (Tuyến 1), đang chạy
(1, 1, 1, '17/11/2025', '06:05:00', N'IN_PROGRESS', 10.7755, 106.6952, 1), -- ID Lịch trình 1
-- Chuyến sáng nay (Tuyến 3), sẵn sàng
(2, 2, 1, '17/11/2025', '06:15:00', N'READY', NULL, NULL, 3), -- ID Lịch trình 2
-- Chuyến hôm qua (Tuyến 1), đã hoàn thành
(1, 1, 1, '16/11/2025', '06:02:00', N'DONE', NULL, NULL, 1); -- ID Lịch trình 3
GO

-- ==============================
-- 4.1) DIEMDANH (Giả sử ID Lịch trình 1,2,3; HS 1,2,3,4)
-- ==============================
PRINT N'Chèn dữ liệu DIEMDANH...';
INSERT INTO dbo.DIEMDANH (idLichTrinh, idHocSinh, trangThai)
VALUES
-- Lịch trình 1 (Sáng nay, Tuyến 1 - có HS 1, 2, 3)
(1, 1, N'DA_DON'), -- HS 1 đã được đón
(1, 2, N'VANG'), -- HS 2 vắng
(1, 3, N'DA_DON'), -- HS 3 đã được đón
-- Lịch trình 2 (Sáng nay, Tuyến 3 - có HS 4)
(2, 4, NULL), -- Chuyến này chưa chạy, trạng thái NULL
-- Lịch trình 3 (Hôm qua, Tuyến 1 - có HS 1, 2, 3)
(3, 1, N'DA_DON'),
(3, 2, N'DA_DON'),
(3, 3, N'DA_DON');
GO

PRINT N'Hoàn thành chèn dữ liệu mẫu.';
GO