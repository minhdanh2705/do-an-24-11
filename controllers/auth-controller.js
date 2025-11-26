import { sql, poolPromise } from '../config/database.js';

export const login = async (req, res) => {
    // Lấy username, password từ body (xử lý trường hợp body null)
    const { username, password } = req.body || {};
    
    console.log('[v0] Login attempt:', { username });
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Thiếu username hoặc password' });
    }

    try {
        const pool = await poolPromise;
        
        // --- CÂU QUERY ĐÃ SỬA ---
        // Lấy thêm trạng thái chi tiết của từng vai trò (tx.trangThai, ph.trangThai...)
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT 
                    tk.idTaiKhoan, tk.taiKhoan, tk.matKhau, tk.vaiTro,
                    tk.idPhuHuynh, tk.idTaiXe, tk.idQuanLy, tk.trangThai as trangThaiTaiKhoan,
                    
                    -- Thông tin chi tiết
                    ph.hoTen AS phuHuynhName, ph.soDienThoai AS phuHuynhPhone, ph.trangThai AS trangThaiPhuHuynh,
                    tx.hoTen AS taiXeName, tx.soDienThoai AS taiXePhone, tx.trangThai AS trangThaiTaiXe,
                    ql.hoTen AS quanLyName, ql.trangThai AS trangThaiQuanLy

                FROM TAIKHOAN tk
                LEFT JOIN PHUHUYNH ph ON tk.idPhuHuynh = ph.idPhuHuynh
                LEFT JOIN TAIXE tx ON tk.idTaiXe = tx.idTaiXe
                LEFT JOIN QUANLY ql ON tk.idQuanLy = ql.idQuanLy
                WHERE tk.taiKhoan = @username 
            `);
        
        const user = result.recordset[0];

        // 1. Kiểm tra tài khoản có tồn tại không
        if (!user) {
            return res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập!' });
        }

        // 2. Kiểm tra mật khẩu (So sánh thô, nếu dùng bcrypt thì sửa lại ở đây)
        if (user.matKhau !== password) {
            return res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập!' });
        }

        // 3. --- KIỂM TRA TRẠNG THÁI (Logic Mới) ---
        // Nếu bảng TAIKHOAN bị khóa -> Chặn
        if (user.trangThaiTaiKhoan === 0) {
            return res.status(403).json({ success: false, message: 'Tài khoản này đã bị khóa.' });
        }

        // Kiểm tra trạng thái cụ thể theo từng vai trò
        let isLocked = false;
        if (user.vaiTro === 'TAI_XE' && user.trangThaiTaiXe === 0) {
            isLocked = true;
        } else if (user.vaiTro === 'PHU_HUYNH' && user.trangThaiPhuHuynh === 0) {
            isLocked = true;
        } else if (user.vaiTro === 'QUAN_LY' && user.trangThaiQuanLy === 0) {
            isLocked = true;
        }

        if (isLocked) {
            return res.status(403).json({ 
                success: false, 
                message: 'Hồ sơ của bạn đang bị tạm ngưng hoạt động. Vui lòng liên hệ Admin.' 
            });
        }

        // 4. Chuẩn bị dữ liệu trả về
        const role = user.vaiTro;
        let detail = {};
        
        if (role === 'PHU_HUYNH') {
            detail = { idPhuHuynh: user.idPhuHuynh, hoTen: user.phuHuynhName, soDienThoai: user.phuHuynhPhone };
        } else if (role === 'TAI_XE') {
            detail = { idTaiXe: user.idTaiXe, hoTen: user.taiXeName, soDienThoai: user.taiXePhone };
        } else if (role === 'QUAN_LY') {
            detail = { idQuanLy: user.idQuanLy, hoTen: user.quanLyName };
        }
        
        // Lưu vào session (nếu dùng express-session)
        if (req.session) {
            req.session.user = {
                idTaiKhoan: user.idTaiKhoan,
                username: user.taiKhoan,
                role: user.vaiTro,
                idTaiXe: user.idTaiXe,     // Lưu ID định danh ra ngoài để dễ truy cập
                idPhuHuynh: user.idPhuHuynh,
                detail: detail
            };
        }

        res.json({
            success: true,
            user: {
                id: user.idTaiKhoan, // idTaiKhoan
                idTaiKhoan: user.idTaiKhoan,
                username: user.taiKhoan,
                role: user.vaiTro,
                
                // Trả về ID định danh quan trọng
                idTaiXe: user.idTaiXe,
                idPhuHuynh: user.idPhuHuynh,
                
                detail: detail
            },
            message: `Đăng nhập thành công với vai trò ${role}`
        });

    } catch (err) {
        console.error('[v0] Login error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const logout = (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi khi đăng xuất' });
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Đăng xuất thành công' });
        });
    } else {
        res.json({ success: true, message: 'Đăng xuất thành công' });
    }
};

export const checkSession = (req, res) => {
    if (req.session && req.session.user) {
        // Session còn tồn tại -> Trả về thông tin user
        return res.json({ 
            success: true, 
            user: req.session.user 
        });
    } else {
        // Session hết hạn hoặc không tồn tại
        return res.status(401).json({ 
            success: false, 
            message: 'Chưa đăng nhập hoặc phiên đã hết hạn' 
        });
    }
};