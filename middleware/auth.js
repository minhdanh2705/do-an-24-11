// Middleware xác thực cho các routes cần bảo vệ
const checkAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ 
        success: false, 
        message: 'Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.' 
    });
};

// Middleware kiểm tra vai trò
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Chưa đăng nhập.' 
            });
        }
        
        const userRole = req.session.user.vaiTro;
        if (allowedRoles.includes(userRole)) {
            return next();
        }
        
        return res.status(403).json({ 
            success: false, 
            message: 'Bạn không có quyền truy cập chức năng này.' 
        });
    };
};

module.exports = {
    checkAuth,
    checkRole
};
