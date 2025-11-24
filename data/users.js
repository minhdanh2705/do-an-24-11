const users = [
  // Admin / Quản lý
  {
    username: 'admin',
    password: 'admin123',
    role: 'QUAN_LY',
    detail: {
      idQuanLy: 1,
      hoTen: 'Nguyễn Văn Admin',
      email: 'admin@ssb.vn',
      trangThai: 1
    }
  },
  // Tài xế
  {
    username: 'taixe1',
    password: 'taixe123',
    role: 'TAI_XE',
    detail: {
      idTaiXe: 1,
      hoTen: 'Trần Văn Tài Xế',
      soDienThoai: '0901234567',
      email: 'driver1@ssb.vn',
      trangThai: 1
    }
  },
  {
    username: 'driver2',
    password: 'driver123',
    role: 'TAI_XE',
    detail: {
      idTaiXe: 2,
      hoTen: 'Lê Thị Tài Xế',
      soDienThoai: '0901234568',
      email: 'driver2@ssb.vn',
      trangThai: 1
    }
  },
  // Phụ huynh
  {
    username: 'phuhuynh1',
    password: 'ph123',
    role: 'PHU_HUYNH',
    detail: {
      idPhuHuynh: 1,
      hoTen: 'Phạm Thị Phụ Huynh',
      soDienThoai: '0912345678',
      email: 'parent1@ssb.vn',
      trangThai: 1
    }
  },
  {
    username: 'parent2',
    password: 'parent123',
    role: 'PHU_HUYNH',
    detail: {
      idPhuHuynh: 2,
      hoTen: 'Hoàng Văn Phụ Huynh',
      soDienThoai: '0912345679',
      email: 'parent2@ssb.vn',
      trangThai: 1
    }
  }
];

module.exports = users;
