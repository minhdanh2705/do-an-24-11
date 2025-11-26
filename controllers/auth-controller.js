import { sql, connectDB } from '../config/database.js';

export const login = async (req, res) => {
    const { username, password } = req.body || {};
    
    console.log('[v0] Login attempt:', { username });
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Thiếu username hoặc password' });
    }

    try {
        const pool = await connectDB();
        
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT 
                    tk.idTaiKhoan, tk.taiKhoan, tk.vaiTro,
                    tk.idPhuHuynh, tk.idTaiXe, tk.idQuanLy,
                    ph.hoTen AS phuHuynhName, ph.soDienThoai AS phuHuynhPhone,
                    tx.hoTen AS taiXeName, tx.soDienThoai AS taiXePhone,
                    ql.hoTen AS quanLyName
                FROM TAIKHOAN tk
                LEFT JOIN PHUHUYNH ph ON tk.idPhuHuynh = ph.idPhuHuynh
                LEFT JOIN TAIXE tx ON tk.idTaiXe = tx.idTaiXe
                LEFT JOIN QUANLY ql ON tk.idQuanLy = ql.idQuanLy
                WHERE tk.taiKhoan = @username 
                  AND tk.matKhau = @password
                  AND tk.trangThai = 1
            `);
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập!' });
        }

        const user = result.recordset[0];
        const role = user.vaiTro;
        
        let detail = {};
        if (role === 'PHU_HUYNH') {
            detail = { idPhuHuynh: user.idPhuHuynh, hoTen: user.phuHuynhName, soDienThoai: user.phuHuynhPhone };
        } else if (role === 'TAI_XE') {
            detail = { idTaiXe: user.idTaiXe, hoTen: user.taiXeName, soDienThoai: user.taiXePhone };
        } else if (role === 'QUAN_LY') {
            detail = { idQuanLy: user.idQuanLy, hoTen: user.quanLyName };
        }
        
        // Lưu vào session
        if (req.session) {
            req.session.user = {
                idTaiKhoan: user.idTaiKhoan,
                username: user.taiKhoan,
                role: user.vaiTro,
                detail: detail
            };
        }

        res.json({
            success: true,
            user: {
                idTaiKhoan: user.idTaiKhoan,
                username: user.taiKhoan,
                role: user.vaiTro,
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