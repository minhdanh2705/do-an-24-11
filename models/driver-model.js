import { sql, pool } from '../config/database.js';

class Driver {
    // GET tất cả tài xế
    static async getAll() {
        const db = await pool;
        if (!db) throw new Error('Không thể kết nối DB');

        const result = await db.request()
            .query(`
                SELECT 
                    t.idTaiXe, t.hoTen, t.soDienThoai, t.email, t.trangThai,
                    tk.taiKhoan 
                FROM TAIXE t
                JOIN TAIKHOAN tk ON t.idTaiXe = tk.idTaiXe
                WHERE t.trangThai = 1
                ORDER BY t.hoTen
            `);
        return result.recordset;
    }

    // GET tài xế theo id
    static async getById(id) {
        const db = await pool;
        if (!db) throw new Error('Không thể kết nối DB');

        const result = await db.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    t.idTaiXe, t.hoTen, t.soDienThoai, t.email, t.trangThai,
                    tk.taiKhoan, tk.idTaiKhoan
                FROM TAIXE t
                LEFT JOIN TAIKHOAN tk ON t.idTaiXe = tk.idTaiXe
                WHERE t.idTaiXe = @id
            `);
        return result.recordset[0];
    }

    // POST tạo tài xế mới (với transaction)
    static async create(driverData) {
        const { hoTen, soDienThoai, email, taiKhoan, matKhau } = driverData;

        const db = await pool;
        if (!db) throw new Error('Không thể kết nối DB');

        const transaction = new sql.Transaction(db);
        await transaction.begin();

        try {
            // 1. Kiểm tra username tồn tại
            const checkUser = await transaction.request()
                .input('taiKhoan', sql.NVarChar, taiKhoan)
                .query('SELECT COUNT(*) as count FROM TAIKHOAN WHERE taiKhoan = @taiKhoan');

            if (checkUser.recordset[0].count > 0) {
                throw new Error('Tên tài khoản (username) đã tồn tại');
            }

            // 2. Thêm vào TAIXE
            const driverResult = await transaction.request()
                .input('hoTen', sql.NVarChar, hoTen)
                .input('soDienThoai', sql.NVarChar, soDienThoai)
                .input('email', sql.NVarChar, email)
                .input('trangThai', sql.Int, 1)
                .query(`
                    INSERT INTO TAIXE (hoTen, soDienThoai, email, trangThai)
                    OUTPUT INSERTED.idTaiXe
                    VALUES (@hoTen, @soDienThoai, @email, @trangThai)
                `);

            const newDriverId = driverResult.recordset[0].idTaiXe;

            // 3. Thêm vào TAIKHOAN
            const accountResult = await transaction.request()
                .input('taiKhoan', sql.NVarChar, taiKhoan)
                .input('matKhau', sql.NVarChar, matKhau) 
                .input('trangThai', sql.Int, 1)
                .input('vaiTro', sql.NVarChar, 'TAI_XE')
                .input('idTaiXe', sql.Int, newDriverId)
                .query(`
                    INSERT INTO TAIKHOAN (taiKhoan, matKhau, trangThai, vaiTro, idTaiXe)
                    OUTPUT INSERTED.idTaiKhoan, INSERTED.taiKhoan
                    VALUES (@taiKhoan, @matKhau, @trangThai, @vaiTro, @idTaiXe)
                `);

            await transaction.commit();

            return {
                idTaiXe: newDriverId,
                hoTen: hoTen,
                soDienThoai: soDienThoai,
                email: email,
                idTaiKhoan: accountResult.recordset[0].idTaiKhoan,
                taiKhoan: accountResult.recordset[0].taiKhoan
            };

        } catch (err) {
            await transaction.rollback();
            throw err; 
        }
    }

    // PUT cập nhật tài xế
    static async update(id, driverData) {
        const { hoTen, soDienThoai, email, trangThai } = driverData;
        const db = await pool;
        if (!db) throw new Error('Không thể kết nối DB');

        let updates = [];
        if (hoTen !== undefined) updates.push('hoTen = @hoTen');
        if (soDienThoai !== undefined) updates.push('soDienThoai = @soDienThoai');
        if (email !== undefined) updates.push('email = @email');
        if (trangThai !== undefined) updates.push('trangThai = @trangThai');

        if (updates.length === 0) {
            return { message: 'Không có thông tin cần cập nhật' };
        }

        const request = db.request().input('id', sql.Int, id);
        if (hoTen !== undefined) request.input('hoTen', sql.NVarChar, hoTen);
        if (soDienThoai !== undefined) request.input('soDienThoai', sql.NVarChar, soDienThoai);
        if (email !== undefined) request.input('email', sql.NVarChar, email);
        if (trangThai !== undefined) request.input('trangThai', sql.Int, trangThai);

        const result = await request.query(`
            UPDATE TAIXE
            SET ${updates.join(', ')}
            OUTPUT INSERTED.idTaiXe, INSERTED.hoTen, INSERTED.soDienThoai, INSERTED.email, INSERTED.trangThai
            WHERE idTaiXe = @id
        `);

        if (result.rowsAffected[0] === 0) {
            throw new Error('Không tìm thấy tài xế');
        }
        return result.recordset[0];
    }

    // DELETE (vô hiệu hóa) tài xế
    static async remove(id) {
        const db = await pool;
        if (!db) throw new Error('Không thể kết nối DB');

        // 1. Kiểm tra ràng buộc (ví dụ: lịch trình đang chạy)
        const checkUsage = await db.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT COUNT(*) as count 
                FROM LICHTRINH 
                WHERE idTaiXe = @id AND trangThai = 'IN_PROGRESS' 
            `);

        if (checkUsage.recordset[0].count > 0) {
            throw new Error('Không thể vô hiệu hóa tài xế đang thực hiện lịch trình');
        }

        // 2. Bắt đầu transaction
        const transaction = new sql.Transaction(db);
        await transaction.begin();

        try {
            // 2a. Vô hiệu hóa TAIXE
            const driverResult = await transaction.request()
                .input('id', sql.Int, id)
                .query(`
                    UPDATE TAIXE SET trangThai = 0 
                    OUTPUT DELETED.idTaiXe
                    WHERE idTaiXe = @id AND trangThai = 1
                `);

            if (driverResult.rowsAffected[0] === 0) {
                throw new Error('Không tìm thấy tài xế hoặc tài xế đã bị vô hiệu hóa');
            }

            // 2b. Vô hiệu hóa TAIKHOAN
            await transaction.request()
                .input('id', sql.Int, id)
                .query('UPDATE TAIKHOAN SET trangThai = 0 WHERE idTaiXe = @id');

            await transaction.commit();
            return { idTaiXe: id, message: 'Vô hiệu hóa tài xế thành công' };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}

export default Driver;