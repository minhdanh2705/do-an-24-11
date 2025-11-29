import { sql, poolPromise } from '../config/database.js';

class Parent {
    // Lấy danh sách con + Trạng thái xe hôm nay
    static async getStudentsByParentId(parentId) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('parentId', sql.Int, parentId)
            .query(`
                SELECT DISTINCT  -- <--- THÊM TỪ KHÓA NÀY ĐỂ CHỐNG TRÙNG LẶP
                    -- Thông tin Bé
                    h.idHocSinh, h.hoTen, h.lop, 
                    
                    -- Thông tin Điểm đón
                    dd.tenDiemDung as tenDiemDon, 
                    dd.viDo as latDon, dd.kinhDo as lngDon,
                    tdd.thuTu as thuTuDiemDon,

                    -- Thông tin Tuyến
                    t.tenTuyen,
                    t.idTuyenDuong,

                    -- Thông tin Chuyến xe HÔM NAY (nếu có)
                    lt.idLichTrinh, 
                    lt.trangThaiDiChuyen, -- 0: Chưa, 1: Đang chạy, 2: Xong
                    lt.thuTuTramHienTai,  -- Xe đang ở đâu
                    lt.thoiGianBatDau, 
                    
                    -- Thông tin Tài xế & Xe
                    tx.hoTen as tenTaiXe, tx.soDienThoai as sdtTaiXe,
                    xb.bienSo as bienSoXe,
                    
                    -- Trạng thái điểm danh (0: Chưa, 1: Đã đón, 2: Đã trả, 3: Vắng)
                    d.trangThai as trangThaiDiemDanh

                FROM HOCSINH h
                -- 1. Join để lấy Tuyến & Điểm dừng
                LEFT JOIN TUYENDUONG t ON h.idTuyen = t.idTuyenDuong
                LEFT JOIN DIEMDUNG dd ON h.idDiemDon = dd.idDiemDung
                LEFT JOIN TUYENDUONG_DIEMDUNG tdd ON t.idTuyenDuong = tdd.idTuyenDuong AND h.idDiemDon = tdd.idDiemDung
                
                -- 2. Join Lịch trình HÔM NAY (ngayChay = GETDATE)
                LEFT JOIN LICHTRINH lt ON t.idTuyenDuong = lt.idTuyen 
                                       AND lt.ngayChay = CAST(GETDATE() AS DATE)
                
                LEFT JOIN TAIXE tx ON lt.idTaiXe = tx.idTaiXe
                LEFT JOIN XEBUS xb ON lt.idXe = xb.idXe
                
                -- 3. Join Điểm danh để biết bé đã lên xe chưa
                -- Quan trọng: Join theo cả idLichTrinh và idHocSinh để lấy đúng trạng thái của chuyến đó
                LEFT JOIN DIEMDANH d ON lt.idLichTrinh = d.idLichTrinh AND h.idHocSinh = d.idHocSinh

                WHERE h.idPhuHuynh = @parentId AND h.trangThai = 1
            `);
        return result.recordset;
    }
}

export default Parent;