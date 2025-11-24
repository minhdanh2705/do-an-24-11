import { sql, pool } from '../config/database.js';

class Bus {
    // SỬA 1: Lấy tất cả xe, không lọc trạng thái nữa
    static async getAll() {
        const db = await pool;
        // Thêm ORDER BY idXe DESC để xe mới thêm hiện lên đầu (tuỳ chọn)
        const result = await db.request().query('SELECT * FROM XEBUS ORDER BY idXe DESC'); 
        return result.recordset;
    }

    static async getById(id) {
        const db = await pool;
        const result = await db.request().input('id', sql.Int, id)
            .query(`SELECT idXe as idXeBus, bienSo, sucChua, trangThai FROM XEBUS WHERE idXe = @id`);
        return result.recordset[0];
    }

    static async create(busData) {
        // SỬA 2: Nhận thêm biến trangThai từ dữ liệu gửi lên
        const { bienSo, sucChua, trangThai } = busData; 
        const db = await pool;

        const checkResult = await db.request().input('bienSo', sql.NVarChar, bienSo)
            .query('SELECT COUNT(*) as count FROM XEBUS WHERE bienSo = @bienSo');

        if (checkResult.recordset[0].count > 0) throw new Error('Biển số xe đã tồn tại');

        const result = await db.request()
            .input('bienSo', sql.NVarChar, bienSo)
            .input('sucChua', sql.Int, sucChua)
            // Nếu không gửi trạng thái thì mặc định là 1 (Hoạt động), nếu có thì dùng giá trị gửi lên
            .input('trangThai', sql.Int, trangThai !== undefined ? trangThai : 1) 
            .query(`INSERT INTO XEBUS (bienSo, sucChua, trangThai) OUTPUT INSERTED.* VALUES (@bienSo, @sucChua, @trangThai)`);
        return result.recordset[0];
    }

    static async update(id, busData) {
        const { bienSo, sucChua, trangThai } = busData;
        const db = await pool;

        const checkResult = await db.request().input('id', sql.Int, id).query('SELECT COUNT(*) as count FROM XEBUS WHERE idXe = @id');
        if (checkResult.recordset[0].count === 0) throw new Error('Không tìm thấy xe bus');

        if (bienSo) {
            const bienSoCheck = await db.request().input('bienSo', sql.NVarChar, bienSo).input('id', sql.Int, id)
                .query('SELECT COUNT(*) as count FROM XEBUS WHERE bienSo = @bienSo AND idXe != @id');
            if (bienSoCheck.recordset[0].count > 0) throw new Error('Biển số xe đã tồn tại');
        }

        let updates = [];
        if (bienSo) updates.push('bienSo = @bienSo');
        if (sucChua) updates.push('sucChua = @sucChua');
        
        // Kiểm tra undefined kỹ hơn để cho phép update số 0
        if (trangThai !== undefined && trangThai !== null) updates.push('trangThai = @trangThai');

        if (updates.length === 0) return { message: 'Không có thông tin cần cập nhật' };

        const request = db.request().input('id', sql.Int, id);
        if (bienSo) request.input('bienSo', sql.NVarChar, bienSo);
        if (sucChua) request.input('sucChua', sql.Int, sucChua);
        if (trangThai !== undefined && trangThai !== null) request.input('trangThai', sql.Int, trangThai);

        const result = await request.query(`UPDATE XEBUS SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE idXe = @id`);
        return result.recordset[0];
    }

    static async remove(id) {
        const db = await pool;
        
        // SỬA 3: Bỏ điều kiện 'AND trangThai = 1'. 
        // Cho phép xoá dù xe đang ở trạng thái nào, miễn là tìm thấy ID.
        const checkResult = await db.request().input('id', sql.Int, id)
            .query(`SELECT idXe FROM XEBUS WHERE idXe = @id`);

        if (!checkResult.recordset.length) throw new Error('Không tìm thấy xe bus');

        const usageCheck = await db.request().input('id', sql.Int, id)
            .query(`SELECT COUNT(*) as count FROM LICHTRINH WHERE idXe = @id AND trangThai NOT IN ('DONE', 'CANCELLED')`);

        if (usageCheck.recordset[0].count > 0) throw new Error('Không thể xóa xe đang sử dụng');

        // Soft delete: Chuyển trạng thái về 0 (Ngưng hoạt động)
        const result = await db.request().input('id', sql.Int, id)
            .query(`UPDATE XEBUS SET trangThai = 0 OUTPUT INSERTED.* WHERE idXe = @id`);
        return result.recordset[0];
    }
}
export default Bus;