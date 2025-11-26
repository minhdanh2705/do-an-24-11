import { sql, pool } from '../config/database.js';

class Stop {
    static async getAll() {
        const db = await pool;
        const result = await db.request().query('SELECT * FROM DIEMDUNG ORDER BY tenDiemDung');
        return result.recordset;
    }

    static async getById(id) {
        const db = await pool;
        const result = await db.request().input('id', sql.Int, id).query('SELECT * FROM DIEMDUNG WHERE idDiemDung = @id');
        return result.recordset[0];
    }

    static async create(stopData) {
        const { idDiemDung, tenDiemDung, kinhDo, viDo } = stopData;
        const db = await pool;
        const result = await db.request()
            .input('idDiemDung', sql.Int, idDiemDung)
            .input('tenDiemDung', sql.NVarChar, tenDiemDung)
            .input('kinhDo', sql.Float, kinhDo)
            .input('viDo', sql.Float, viDo)
            .query(`INSERT INTO DIEMDUNG (idDiemDung, tenDiemDung, kinhDo, viDo) OUTPUT INSERTED.* VALUES (@idDiemDung, @tenDiemDung, @kinhDo, @viDo)`);
        return result.recordset[0];
    }

    static async update(id, stopData) {
        const { tenDiemDung, kinhDo, viDo } = stopData;
        const db = await pool;
        const check = await db.request().input('id', sql.Int, id).query('SELECT COUNT(*) as count FROM DIEMDUNG WHERE idDiemDung = @id');
        if (check.recordset[0].count === 0) throw new Error('Không tìm thấy điểm dừng');

        let updates = [];
        if (tenDiemDung) updates.push('tenDiemDung = @tenDiemDung');
        if (kinhDo) updates.push('kinhDo = @kinhDo');
        if (viDo) updates.push('viDo = @viDo');

        if (!updates.length) return { message: 'Không có thông tin cần cập nhật' };

        const request = db.request().input('id', sql.Int, id);
        if (tenDiemDung) request.input('tenDiemDung', sql.NVarChar, tenDiemDung);
        if (kinhDo) request.input('kinhDo', sql.Float, kinhDo);
        if (viDo) request.input('viDo', sql.Float, viDo);

        const result = await request.query(`UPDATE DIEMDUNG SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE idDiemDung = @id`);
        return result.recordset[0];
    }

    static async remove(id) {
        const db = await pool;
        const checkUsage = await db.request().input('id', sql.Int, id)
            .query(`SELECT (SELECT COUNT(*) FROM TUYENDUONG_DIEMDUNG WHERE idDiemDung = @id) as c1, (SELECT COUNT(*) FROM HOCSINH WHERE diemDon = @id) as c2`);
        if (checkUsage.recordset[0].c1 > 0 || checkUsage.recordset[0].c2 > 0) throw new Error('Không thể xóa điểm dừng đang sử dụng');

        const result = await db.request().input('id', sql.Int, id).query('DELETE FROM DIEMDUNG OUTPUT DELETED.* WHERE idDiemDung = @id');
        if (!result.rowsAffected[0]) throw new Error('Không tìm thấy điểm dừng');
        return result.recordset[0];
    }
}
export default Stop;