import { sql, poolPromise } from '../config/database.js'; // Lưu ý: dùng poolPromise

class Route {
    static async getAll() {
        const pool = await poolPromise;
        // Chỉ lấy các cột có trong DB 4h42.sql
        const result = await pool.request().query(`
            SELECT idTuyenDuong as idTuyen, tenTuyen, moTa, khoangCach, thoiGianDuKien
            FROM TUYENDUONG
            ORDER BY idTuyenDuong
        `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const routeResult = await pool.request().input('id', sql.Int, id).query(`
            SELECT idTuyenDuong as idTuyen, tenTuyen, moTa, khoangCach, thoiGianDuKien
            FROM TUYENDUONG
            WHERE idTuyenDuong = @id
        `);

        if (!routeResult.recordset.length) return null;
        const route = routeResult.recordset[0];

        // Lấy danh sách điểm dừng
        const stopsResult = await pool.request().input('id', sql.Int, id).query(`
            SELECT d.idDiemDung, d.tenDiemDung, d.kinhDo, d.viDo, td.thuTu
            FROM DIEMDUNG d
            JOIN TUYENDUONG_DIEMDUNG td ON d.idDiemDung = td.idDiemDung
            WHERE td.idTuyenDuong = @id 
            ORDER BY td.thuTu
        `);
        route.diemDung = stopsResult.recordset;
        return route;
    }

    static async create(routeData) {
        // DB chỉ cần tenTuyen, moTa, khoangCach, thoiGianDuKien
        const { tenTuyen, moTa, khoangCach, thoiGianDuKien, diemDung } = routeData;
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = transaction.request()
                .input('tenTuyen', sql.NVarChar, tenTuyen)
                .input('moTa', sql.NVarChar, moTa || '')
                .input('khoangCach', sql.Float, khoangCach || 0)
                .input('thoiGianDuKien', sql.Int, thoiGianDuKien || 0);

            const routeResult = await request.query(`
                INSERT INTO TUYENDUONG (tenTuyen, moTa, khoangCach, thoiGianDuKien)
                OUTPUT INSERTED.idTuyenDuong as idTuyen
                VALUES (@tenTuyen, @moTa, @khoangCach, @thoiGianDuKien)
            `);
            const newRoute = routeResult.recordset[0];

            if (diemDung && diemDung.length > 0) {
                for (let i = 0; i < diemDung.length; i++) {
                    await transaction.request()
                        .input('idTuyen', sql.Int, newRoute.idTuyen)
                        .input('idDiem', sql.Int, diemDung[i].idDiemDung) // Frontend phải gửi đúng idDiemDung
                        .input('thuTu', sql.Int, i + 1)
                        .query(`INSERT INTO TUYENDUONG_DIEMDUNG (idTuyenDuong, idDiemDung, thuTu) VALUES (@idTuyen, @idDiem, @thuTu)`);
                }
            }
            await transaction.commit();
            return newRoute;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async remove(id) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await transaction.request().input('id', sql.Int, id).query('DELETE FROM TUYENDUONG_DIEMDUNG WHERE idTuyenDuong = @id');
            const result = await transaction.request().input('id', sql.Int, id).query('DELETE FROM TUYENDUONG OUTPUT DELETED.* WHERE idTuyenDuong = @id');
            if (!result.recordset.length) throw new Error('Tuyến xe không tồn tại');
            await transaction.commit();
            return result.recordset[0];
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}
export default Route;