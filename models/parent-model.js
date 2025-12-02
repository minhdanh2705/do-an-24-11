import { sql, poolPromise } from '../config/database.js';
class Parent {
    static async getStudentsByParentId(parentId) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('parentId', sql.Int, parentId)
            .query(`
                SELECT DISTINCT  
                    h.idHocSinh, h.hoTen, h.lop, 
                    dd.tenDiemDung as tenDiemDon, 
                    dd.viDo as latDon, dd.kinhDo as lngDon,
                    tdd.thuTu as thuTuDiemDon,
                    t.tenTuyen, t.idTuyenDuong,
                    lt.idLichTrinh, lt.trangThaiDiChuyen, lt.thuTuTramHienTai, lt.thoiGianBatDau, 
                    tx.hoTen as tenTaiXe, tx.soDienThoai as sdtTaiXe,
                    xb.bienSo as bienSoXe,
                    d.trangThai as trangThaiDiemDanh
                FROM HOCSINH h
                LEFT JOIN TUYENDUONG t ON h.idTuyen = t.idTuyenDuong
                LEFT JOIN DIEMDUNG dd ON h.idDiemDon = dd.idDiemDung
                LEFT JOIN TUYENDUONG_DIEMDUNG tdd ON t.idTuyenDuong = tdd.idTuyenDuong AND h.idDiemDon = tdd.idDiemDung
                LEFT JOIN LICHTRINH lt ON t.idTuyenDuong = lt.idTuyen AND lt.ngayChay = CAST(GETDATE() AS DATE)
                LEFT JOIN TAIXE tx ON lt.idTaiXe = tx.idTaiXe
                LEFT JOIN XEBUS xb ON lt.idXe = xb.idXe
                LEFT JOIN DIEMDANH d ON lt.idLichTrinh = d.idLichTrinh AND h.idHocSinh = d.idHocSinh
                WHERE h.idPhuHuynh = @parentId AND h.trangThai = 1
            `);
        return result.recordset;
    }

    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM PHUHUYNH WHERE trangThai = 1 ORDER BY idPhuHuynh DESC');
        return result.recordset;
    }

    static async remove(id) {
        const pool = await poolPromise;
        const activeCheck = await pool.request().input('id', sql.Int, id)
            .query(`SELECT COUNT(*) as count FROM HOCSINH WHERE idPhuHuynh = @id AND trangThai = 1`);

        if (activeCheck.recordset[0].count > 0) {
            throw new Error('CẢNH BÁO: Phụ huynh này đang có con đang theo học. Không thể xóa!');
        }

        const result = await pool.request().input('id', sql.Int, id)
            .query('UPDATE PHUHUYNH SET trangThai = 0 OUTPUT INSERTED.* WHERE idPhuHuynh = @id');
        
        if (!result.recordset.length) throw new Error('Không tìm thấy phụ huynh');

        return { message: 'Đã vô hiệu hóa tài khoản phụ huynh thành công' };
    }

    // --- HÀM TẠO MỚI  ---
    static async create(data) {
        const { hoTen, soDienThoai, email, tenDangNhap, matKhau } = data;
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // 1. Kiểm tra trùng
            const checkInfo = await transaction.request()
                .input('sdt', sql.VarChar, soDienThoai)
                .input('email', sql.VarChar, email)
                .query(`SELECT (SELECT COUNT(*) FROM PHUHUYNH WHERE soDienThoai = @sdt AND trangThai = 1) as c1, (SELECT COUNT(*) FROM PHUHUYNH WHERE email = @email AND trangThai = 1) as c2`);
            
            if (checkInfo.recordset[0].c1 > 0) throw new Error('Số điện thoại đã được sử dụng!');
            if (checkInfo.recordset[0].c2 > 0) throw new Error('Email đã được sử dụng!');

            const checkUser = await transaction.request().input('user', sql.VarChar, tenDangNhap)
                .query(`SELECT COUNT(*) as count FROM TAIKHOAN WHERE taiKhoan = @user`);
            if (checkUser.recordset[0].count > 0) throw new Error('Tên đăng nhập đã tồn tại!');

            // 2. Thêm Phụ huynh
            const parentRes = await transaction.request()
                .input('hoTen', sql.NVarChar, hoTen)
                .input('soDienThoai', sql.VarChar, soDienThoai)
                .input('email', sql.VarChar, email)
                .query(`INSERT INTO PHUHUYNH (hoTen, soDienThoai, email, trangThai) OUTPUT INSERTED.idPhuHuynh VALUES (@hoTen, @soDienThoai, @email, 1)`);
            
            const newParentId = parentRes.recordset[0].idPhuHuynh;

            // 3. Tạo Tài khoản (LƯU TRỰC TIẾP MẬT KHẨU THÔ)
            // Lưu ý: Đã đổi 'hashedPassword' thành 'matKhau'
            await transaction.request()
                .input('taiKhoan', sql.VarChar, tenDangNhap)
                .input('matKhau', sql.VarChar, matKhau) // <--- Truyền thẳng mật khẩu 123456 vào đây
                .input('idPhuHuynh', sql.Int, newParentId)
                .query(`INSERT INTO TAIKHOAN (taiKhoan, matKhau, vaiTro, idPhuHuynh, trangThai) VALUES (@taiKhoan, @matKhau, 'PHU_HUYNH', @idPhuHuynh, 1)`);

            await transaction.commit();
            return { message: 'Thêm phụ huynh thành công!' };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
    
    // Hàm cập nhật (giữ nguyên logic cũ nếu có, ở đây tôi thêm vào để đủ bộ)
    static async update(id, data) {
         const { hoTen, soDienThoai, email } = data;
         const pool = await poolPromise;
         await pool.request()
            .input('id', sql.Int, id)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('soDienThoai', sql.VarChar, soDienThoai)
            .input('email', sql.VarChar, email)
            .query(`UPDATE PHUHUYNH SET hoTen=@hoTen, soDienThoai=@soDienThoai, email=@email WHERE idPhuHuynh=@id`);
         return { message: 'Cập nhật thành công' };
    }
}
export default Parent;