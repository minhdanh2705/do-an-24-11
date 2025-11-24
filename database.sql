USE master;
GO

IF DB_ID('CNPM') IS NOT NULL
BEGIN
    ALTER DATABASE CNPM SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE CNPM;
END
GO

CREATE DATABASE CNPM;
GO
USE CNPM;
GO

-- ==============================
-- 1) DANH MỤC CƠ BẢN
-- ==============================

-- XEBUS: thêm sucChua, bienSo unique
CREATE TABLE dbo.XEBUS(
    idXe        INT IDENTITY(1,1) PRIMARY KEY,
    bienSo      NVARCHAR(255) NOT NULL,
    sucChua     INT NOT NULL CHECK (sucChua > 0),
    trangThai   INT NULL
);
GO
CREATE UNIQUE INDEX UQ_XEBUS_bienSo ON dbo.XEBUS(bienSo);
GO

-- DIEMDUNG (toạ độ giữ nguyên kiểu float như bản cũ; có thể đổi DECIMAL nếu muốn)
CREATE TABLE dbo.DIEMDUNG(
    idDiemDung  INT NOT NULL PRIMARY KEY,
    kinhDo      FLOAT NULL,
    viDo        FLOAT NULL,
    tenDiemDung NVARCHAR(255) NULL
);
GO

-- TUYENDUONG
CREATE TABLE dbo.TUYENDUONG(
    idTuyenDuong INT IDENTITY(1,1) PRIMARY KEY,
    tenTuyen     NVARCHAR(255) NULL,
    gioBatDau    TIME(7) NULL,
    gioKetThuc   TIME(7) NULL
);
GO

-- TUYENDUONG_DIEMDUNG (mapping + thứ tự)
CREATE TABLE dbo.TUYENDUONG_DIEMDUNG(
    idTuyenDuong INT NOT NULL,
    idDiemDung   INT NOT NULL,
    thuTu        INT NULL,
    CONSTRAINT PK_TDD PRIMARY KEY(idTuyenDuong, idDiemDung),
    CONSTRAINT FK_TDD_TUYEN FOREIGN KEY(idTuyenDuong) REFERENCES dbo.TUYENDUONG(idTuyenDuong),
    CONSTRAINT FK_TDD_DIEM  FOREIGN KEY(idDiemDung)   REFERENCES dbo.DIEMDUNG(idDiemDung)
);
GO
CREATE UNIQUE INDEX UQ_TDD_thuTu ON dbo.TUYENDUONG_DIEMDUNG(idTuyenDuong, thuTu);
GO

-- HOCSINH
CREATE TABLE dbo.HOCSINH(
    idHocSinh  INT IDENTITY(1,1) PRIMARY KEY,
    hoTen      NVARCHAR(255) NULL,
    lop        NVARCHAR(255) NULL,
    ngaySinh   DATE NULL,
    noiSinh    NVARCHAR(255) NULL,
    idTuyen    INT NULL,
    diemDon    INT NULL,
    trangThai  INT NULL,
    CONSTRAINT FK_HS_TUYEN FOREIGN KEY(idTuyen) REFERENCES dbo.TUYENDUONG(idTuyenDuong),
    CONSTRAINT FK_HS_DIEM  FOREIGN KEY(diemDon)  REFERENCES dbo.DIEMDUNG(idDiemDung)
);
GO

-- ==============================
-- 2) TÁCH NGƯỜI DÙNG: TAIXE / PHUHUYNH / QUANLY
-- ==============================

CREATE TABLE dbo.TAIXE(
    idTaiXe      INT IDENTITY(1,1) PRIMARY KEY,
    hoTen        NVARCHAR(255) NOT NULL,
    soDienThoai  NVARCHAR(20) NULL,
    email        NVARCHAR(255) NULL,
    trangThai    INT NULL
);
GO

CREATE TABLE dbo.PHUHUYNH(
    idPhuHuynh   INT IDENTITY(1,1) PRIMARY KEY,
    hoTen        NVARCHAR(255) NOT NULL,
    soDienThoai  NVARCHAR(20) NULL,
    email        NVARCHAR(255) NULL,
    trangThai    INT NULL
);
GO

-- Phụ huynh - Học sinh (nhiều-nhiều)
CREATE TABLE dbo.PHUHUYNH_HOCSINH(
    idPhuHuynh INT NOT NULL,
    idHocSinh  INT NOT NULL,
    CONSTRAINT PK_PHUHS PRIMARY KEY(idPhuHuynh, idHocSinh),
    CONSTRAINT FK_PHUHS_PHU FOREIGN KEY(idPhuHuynh) REFERENCES dbo.PHUHUYNH(idPhuHuynh),
    CONSTRAINT FK_PHUHS_HS  FOREIGN KEY(idHocSinh)  REFERENCES dbo.HOCSINH(idHocSinh)
);
GO

CREATE TABLE dbo.QUANLY(
    idQuanLy   INT IDENTITY(1,1) PRIMARY KEY,
    hoTen      NVARCHAR(255) NOT NULL,
    email      NVARCHAR(255) NULL,
    trangThai  INT NULL
);
GO

-- ==============================
-- 3) LỊCH TRÌNH & ĐIỂM DANH
-- ==============================

CREATE TABLE dbo.LICHTRINH(
    idLichTrinh   INT IDENTITY(1,1) PRIMARY KEY,
    idTaiXe       INT NULL,
    idXe          INT NULL,
    idQuanLy      INT NULL,
    ngayThucHien  DATE NULL,
    gioBatDau     TIME(7) NULL,
    trangThai     NVARCHAR(255) NULL, -- READY/IN_PROGRESS/DONE/CANCELLED (gợi ý)
    kinhDo        FLOAT NULL,
    viDo          FLOAT NULL,
    idTuyen       INT NULL,
    CONSTRAINT FK_LT_TAI_XE   FOREIGN KEY(idTaiXe)  REFERENCES dbo.TAIXE(idTaiXe),
    CONSTRAINT FK_LT_XE       FOREIGN KEY(idXe)     REFERENCES dbo.XEBUS(idXe),
    CONSTRAINT FK_LT_QUAN_LY  FOREIGN KEY(idQuanLy) REFERENCES dbo.QUANLY(idQuanLy),
    CONSTRAINT FK_LT_TUYEN    FOREIGN KEY(idTuyen)  REFERENCES dbo.TUYENDUONG(idTuyenDuong)
);
GO

-- DIEMDANH
CREATE TABLE dbo.DIEMDANH(
    idLichTrinh     INT NOT NULL,
    idHocSinh            INT NOT NULL,
    trangThai       NVARCHAR(255) NULL, -- VANG/DA_DON/DA_TRA ...
    CONSTRAINT PK_DIEMDANH PRIMARY KEY(idLichTrinh, idHocSinh),
    CONSTRAINT FK_DD_LT FOREIGN KEY(idLichTrinh) REFERENCES dbo.LICHTRINH(idLichTrinh),
    CONSTRAINT FK_DD_HS FOREIGN KEY(idHocSinh)        REFERENCES dbo.HOCSINH(idHocSinh),
);
GO
CREATE INDEX IX_DD_idHs ON dbo.DIEMDANH(idHocSinh);
CREATE INDEX IX_DD_idLT ON dbo.DIEMDANH(idLichTrinh);
GO

-- ==============================
-- 4) TÀI KHOẢN (liên kết 1 trong 3 vai trò)
-- ==============================

CREATE TABLE dbo.TAIKHOAN(
    idTaiKhoan   INT IDENTITY(1,1) PRIMARY KEY,
    taiKhoan     NVARCHAR(255) NOT NULL,
    matKhau		 NVARCHAR(255) NULL,
    trangThai    INT NULL,
    vaiTro       NVARCHAR(20) NOT NULL,   -- 'PHU_HUYNH' | 'TAI_XE' | 'QUAN_LY'
    idPhuHuynh   INT NULL,
    idTaiXe      INT NULL,
    idQuanLy     INT NULL,
    CONSTRAINT UQ_TK_username UNIQUE(taiKhoan),
    CONSTRAINT FK_TK_PHU FOREIGN KEY(idPhuHuynh) REFERENCES dbo.PHUHUYNH(idPhuHuynh),
    CONSTRAINT FK_TK_TX  FOREIGN KEY(idTaiXe)    REFERENCES dbo.TAIXE(idTaiXe),
    CONSTRAINT FK_TK_QL  FOREIGN KEY(idQuanLy)   REFERENCES dbo.QUANLY(idQuanLy),
    CONSTRAINT CK_TK_ROLE CHECK (
        (vaiTro = N'PHU_HUYNH' AND idPhuHuynh IS NOT NULL AND idTaiXe IS NULL AND idQuanLy IS NULL) OR
        (vaiTro = N'TAI_XE'    AND idTaiXe    IS NOT NULL AND idPhuHuynh IS NULL AND idQuanLy IS NULL) OR
        (vaiTro = N'QUAN_LY'   AND idQuanLy   IS NOT NULL AND idPhuHuynh IS NULL AND idTaiXe IS NULL)
    )
);
GO

-- ==============================
-- 5) INDEX GỢI Ý THÊM
-- ==============================
CREATE INDEX IX_HS_idTuyen ON dbo.HOCSINH(idTuyen);
CREATE INDEX IX_HS_diemDon ON dbo.HOCSINH(diemDon);
CREATE INDEX IX_LT_refs    ON dbo.LICHTRINH(idTuyen, idTaiXe, idXe);
CREATE INDEX IX_TDD_tuyen  ON dbo.TUYENDUONG_DIEMDUNG(idTuyenDuong);
GO
