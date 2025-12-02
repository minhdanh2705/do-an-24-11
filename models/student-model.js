import { sql, poolPromise } from "../config/database.js"

class Student {
  static async getAll() {
    const pool = await poolPromise
    const result = await pool.request().query(`
                SELECT 
                    H.idHocSinh, 
                    H.hoTen, 
                    H.lop, 
                    H.trangThai,
                    P.hoTen as tenPhuHuynh, 
                    P.soDienThoai as sdtPhuHuynh,
                    T.tenTuyen,
                    
                    -- SỬA DÒNG NÀY: Đổi 'diemDon' thành 'tenDiemDon' cho thống nhất với Frontend cũ
                    D.tenDiemDung as tenDiemDon, 
                    
                    CASE 
                        WHEN H.trangThai = 1 THEN N'Đi học' 
                        ELSE N'Nghỉ' 
                    END as trangThaiText
                FROM HOCSINH H
                
                LEFT JOIN PHUHUYNH P ON H.idPhuHuynh = P.idPhuHuynh
                LEFT JOIN TUYENDUONG T ON H.idTuyen = T.idTuyenDuong
                LEFT JOIN DIEMDUNG D ON H.idDiemDon = D.idDiemDung
                WHERE H.trangThai = 1
                ORDER BY H.idHocSinh DESC
            `)
    return result.recordset
  }

  // GET học sinh theo id
  static async getById(id) {
    const pool = await poolPromise
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
                SELECT 
                    H.idHocSinh, H.hoTen, H.lop, H.trangThai,
                    H.idPhuHuynh, H.idTuyen, H.idDiemDon,
                    P.hoTen as tenPhuHuynh, P.soDienThoai,
                    D.tenDiemDung as tenDiemDon,
                    T.tenTuyen
                FROM HOCSINH H
                LEFT JOIN PHUHUYNH P ON H.idPhuHuynh = P.idPhuHuynh
                LEFT JOIN DIEMDUNG D ON H.idDiemDon = D.idDiemDung
                LEFT JOIN TUYENDUONG T ON H.idTuyen = T.idTuyenDuong
                WHERE H.idHocSinh = @id
            `)
    return result.recordset[0]
  }

  static async create(studentData) {
    const { hoTen, lop, idPhuHuynh, idTuyen, idDiemDon } = studentData
    const pool = await poolPromise

    // Validate Tuyến (nếu có chọn)
    if (idTuyen) {
      const routeCheck = await pool
        .request()
        .input("idTuyen", sql.Int, idTuyen)
        .query("SELECT idTuyenDuong FROM TUYENDUONG WHERE idTuyenDuong = @idTuyen")

      if (routeCheck.recordset.length === 0) {
        console.error(`[v0] Route ID ${idTuyen} not found`)
        throw new Error(`Tuyến xe ID ${idTuyen} không tồn tại`)
      }
    }

    // Validate Điểm dừng (nếu có chọn)
    if (idDiemDon) {
      const stopCheck = await pool
        .request()
        .input("idDiemDon", sql.Int, idDiemDon)
        .query("SELECT idDiemDung FROM DIEMDUNG WHERE idDiemDung = @idDiemDon")

      if (stopCheck.recordset.length === 0) {
        console.error(`[v0] Stop ID ${idDiemDon} not found`)
        throw new Error(`Điểm dừng ID ${idDiemDon} không tồn tại`)
      }
    }

    const request = pool
      .request()
      .input("hoTen", sql.NVarChar, hoTen)
      .input("lop", sql.NVarChar, lop)
      .input("trangThai", sql.Int, 1)

    // Xử lý các trường có thể null
    if (idPhuHuynh) request.input("idPhuHuynh", sql.Int, Number.parseInt(idPhuHuynh))
    else request.input("idPhuHuynh", sql.Int, null)

    if (idTuyen) request.input("idTuyen", sql.Int, Number.parseInt(idTuyen))
    else request.input("idTuyen", sql.Int, null)

    if (idDiemDon) request.input("idDiemDon", sql.Int, Number.parseInt(idDiemDon))
    else request.input("idDiemDon", sql.Int, null)

    const query = `
            INSERT INTO HOCSINH (hoTen, lop, idPhuHuynh, idTuyen, idDiemDon, trangThai)
            OUTPUT INSERTED.idHocSinh
            VALUES (@hoTen, @lop, @idPhuHuynh, @idTuyen, @idDiemDon, @trangThai)
        `

    const result = await request.query(query)
    console.log("[v0] Student created successfully:", result.recordset[0])
    return result.recordset[0]
  }

  // PUT cập nhật học sinh
  static async update(id, studentData) {
    const pool = await poolPromise
    const checkResult = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT idHocSinh FROM HOCSINH WHERE idHocSinh = @id")
    if (!checkResult.recordset.length) throw new Error("Không tìm thấy học sinh")

    // Bỏ ngaySinh, noiSinh. Map lại idDiemDon
    const { hoTen, lop, idPhuHuynh, idTuyen, idDiemDon, trangThai } = studentData

    const request = pool.request().input("id", sql.Int, id)
    const updates = []

    if (hoTen !== undefined) {
      request.input("hoTen", sql.NVarChar, hoTen)
      updates.push("hoTen = @hoTen")
    }
    if (lop !== undefined) {
      request.input("lop", sql.NVarChar, lop)
      updates.push("lop = @lop")
    }
    if (idPhuHuynh !== undefined) {
      request.input("idPhuHuynh", sql.Int, idPhuHuynh)
      updates.push("idPhuHuynh = @idPhuHuynh")
    }
    if (idTuyen !== undefined) {
      request.input("idTuyen", sql.Int, idTuyen)
      updates.push("idTuyen = @idTuyen")
    }
    if (idDiemDon !== undefined) {
      request.input("idDiemDon", sql.Int, idDiemDon)
      updates.push("idDiemDon = @idDiemDon")
    }
    if (trangThai !== undefined) {
      request.input("trangThai", sql.Int, trangThai)
      updates.push("trangThai = @trangThai")
    }

    if (updates.length === 0) return { message: "Không có thông tin cần cập nhật" }

    await request.query(`UPDATE HOCSINH SET ${updates.join(", ")} WHERE idHocSinh = @id`)
    return { message: "Cập nhật học sinh thành công!" }
  }

  // DELETE học sinh (Soft Delete)
  // models/student-model.js

// models/student-model.js

  // models/student-model.js

static async remove(id) {
    const pool = await poolPromise;
    
    // 1. KIỂM TRA RÀNG BUỘC
    // Logic: Tìm xem học sinh này có trong bảng DIEMDANH của chuyến xe nào
    // mà chuyến xe đó (LICHTRINH) chưa kết thúc (trangThaiDiChuyen != 2) hay không.
    const activeCheck = await pool.request().input('id', sql.Int, id)
        .query(`
            SELECT COUNT(*) as count 
            FROM DIEMDANH d
            JOIN LICHTRINH l ON d.idLichTrinh = l.idLichTrinh
            WHERE d.idHocSinh = @id 
            AND (l.trangThaiDiChuyen IS NULL OR l.trangThaiDiChuyen != 2)
        `);

    // 2. NẾU BẬN -> BÁO LỖI
    if (activeCheck.recordset[0].count > 0) {
        throw new Error('CẢNH BÁO: Học sinh đang nằm trong danh sách điểm danh của chuyến xe chưa kết thúc. Không thể xóa!');
    }

    // 3. NẾU RẢNH -> XÓA MỀM (Chuyển trạng thái về 0)
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`UPDATE HOCSINH SET trangThai = 0 OUTPUT INSERTED.* WHERE idHocSinh = @id`);

    if (!result.recordset.length) throw new Error('Không tìm thấy học sinh');

    return { message: 'Đã xóa hồ sơ học sinh thành công' };
}

  static async getLinkedParents(studentId) {
    const pool = await poolPromise
    const result = await pool
      .request()
      .input("studentId", sql.Int, studentId)
      .query(`
                SELECT P.idPhuHuynh, P.hoTen, P.soDienThoai, P.email
                FROM PHUHUYNH P
                JOIN HOCSINH H ON P.idPhuHuynh = H.idPhuHuynh
                WHERE H.idHocSinh = @studentId
            `)
    return result.recordset
  }
}

export default Student
