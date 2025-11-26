import { sql, poolPromise } from '../config/database.js';

class Driver {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM TAIXE 
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

    static async remove(id) {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE TAIXE SET trangThai = 0 WHERE idTaiXe = @id');
            
        return { message: 'Đã vô hiệu hóa tài xế' };
    }
}

export default Driver;