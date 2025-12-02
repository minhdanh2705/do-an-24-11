import { sql, poolPromise } from '../config/database.js';

class Driver {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM TAIXE 
            WHERE trangThai = 1
            ORDER BY idTaiXe DESC
        `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM TAIXE WHERE idTaiXe = @id');
        return result.recordset[0];
    }

    static async create(data) {
        const { hoTen, soDienThoai, email, taiKhoan, matKhau } = data;
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        try {
            await transaction.begin();

            // 1. Kiểm tra trùng tài khoản
            const checkUser = await transaction.request()
                .input('tk', sql.NVarChar, taiKhoan)
                .query('SELECT count(*) as count FROM TAIKHOAN WHERE taiKhoan = @tk');
            
            if (checkUser.recordset[0].count > 0) {
                throw new Error('Tên tài khoản đã tồn tại');
            }

            // 2. Tạo Tài xế
            const driverResult = await transaction.request()
                .input('hoTen', sql.NVarChar, hoTen)
                .input('soDienThoai', sql.VarChar, soDienThoai)
                .input('email', sql.VarChar, email)
                .query(`
                    INSERT INTO TAIXE (hoTen, soDienThoai, email, trangThai) 
                    OUTPUT INSERTED.idTaiXe
                    VALUES (@hoTen, @soDienThoai, @email, 1)
                `);
            
            const newDriverId = driverResult.recordset[0].idTaiXe;

            // 3. Tạo Tài khoản
            await transaction.request()
                .input('taiKhoan', sql.VarChar, taiKhoan)
                .input('matKhau', sql.VarChar, matKhau) // Nên hash password thực tế
                .input('idTaiXe', sql.Int, newDriverId)
                .query(`
                    INSERT INTO TAIKHOAN (taiKhoan, matKhau, vaiTro, idTaiXe, trangThai) 
                    VALUES (@taiKhoan, @matKhau, 'TAI_XE', @idTaiXe, 1)
                `);

            await transaction.commit();
            return { idTaiXe: newDriverId, ...data };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async update(id, data) {
        const { hoTen, soDienThoai, email, trangThai } = data;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('soDienThoai', sql.VarChar, soDienThoai)
            .input('email', sql.VarChar, email)
            .input('trangThai', sql.Int, trangThai)
            .query(`
                UPDATE TAIXE 
                SET hoTen = @hoTen, soDienThoai = @soDienThoai, email = @email, trangThai = @trangThai 
                WHERE idTaiXe = @id
            `);
            
        return { id, ...data };
    }

    // models/driver-model.js

// models/driver-model.js

    // models/driver-model.js

    static async remove(id) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        try {
            await transaction.begin();

            // 1. KIỂM TRA RÀNG BUỘC: Tài xế có đang lái không?
            const activeCheck = await transaction.request().input('id', sql.Int, id)
                .query(`
                    SELECT COUNT(*) as count 
                    FROM LICHTRINH 
                    WHERE idTaiXe = @id AND trangThaiDiChuyen IN (0, 1)
                `);
            
            // 2. Nếu đang bận -> BÁO LỖI
            if(activeCheck.recordset[0].count > 0) {
                throw new Error("CẢNH BÁO: Tài xế đang thực hiện lộ trình, không thể xóa ngay lúc này!");
            }

            // 3. Nếu rảnh -> Xóa mềm
            // 3a. Khóa tài khoản
            await transaction.request().input('id', sql.Int, id)
                .query('UPDATE TAIKHOAN SET trangThai = 0 WHERE idTaiXe = @id');

            // 3b. Ẩn thông tin
            const result = await transaction.request().input('id', sql.Int, id)
                .query('UPDATE TAIXE SET trangThai = 0 OUTPUT INSERTED.* WHERE idTaiXe = @id');

            if (!result.recordset.length) throw new Error('Không tìm thấy tài xế');

            await transaction.commit();
            return { message: 'Đã xóa tài xế thành công' };

        } catch (err) {
            await transaction.rollback();
            throw err; // Ném lỗi ra để Controller bắt được
        }
    }
}

export default Driver;