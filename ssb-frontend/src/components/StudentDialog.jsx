import { useState, useEffect } from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, Grid } from "@mui/material"
import { routeService } from "../services/api" // Sử dụng service chuẩn

const StudentDialog = ({ open, student, routes, parents, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    hoTen: "",
    lop: "",
    idTuyen: 0,  
    idDiemDon: 0,
    idPhuHuynh: "",
    trangThai: 1,
  })
  const [routeStops, setRouteStops] = useState([])

  useEffect(() => {
    if (open) {
      if (student) {
        setFormData({
          hoTen: student.hoTen || "",
          lop: student.lop || "",
          idTuyen: student.idTuyen || 0,
          idDiemDon: student.idDiemDon || 0,
          idPhuHuynh: student.idPhuHuynh || "",
          trangThai: student.trangThai !== undefined ? student.trangThai : 1,
        })
        // Load điểm dừng nếu đang có tuyến
        if (student.idTuyen) fetchStops(student.idTuyen)
      } else {
        // Reset form
        setFormData({ hoTen: "", lop: "", idTuyen: 0, idDiemDon: 0, idPhuHuynh: "", trangThai: 1 })
        setRouteStops([])
      }
    }
  }, [student, open])

  const fetchStops = async (routeId) => {
    if (!routeId) {
        setRouteStops([]);
        return;
    }
    try {
      const res = await routeService.getById(routeId)
      const data = res.data?.data || res.data;
      setRouteStops(data.diemDung || [])
    } catch (error) {
      console.error("Lỗi tải điểm dừng:", error)
      setRouteStops([])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name === "idTuyen") {
      // Nếu chọn tuyến mới: Cập nhật ID và reset điểm đón
      setFormData((prev) => ({ ...prev, idTuyen: value, idDiemDon: 0 }))
      if (value !== 0) {
          fetchStops(value)
      } else {
          setRouteStops([])
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = () => {
    onSave({
      ...formData,
      // Chuyển đổi dữ liệu trước khi gửi lên backend
      idTuyen: formData.idTuyen || null,
      idDiemDon: formData.idDiemDon || null,
      idPhuHuynh: formData.idPhuHuynh || null,
      trangThai: Number(formData.trangThai),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{student ? "Chỉnh sửa học sinh" : "Thêm học sinh mới"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
                <TextField
                name="hoTen"
                label="Họ tên"
                fullWidth
                value={formData.hoTen}
                onChange={handleChange}
                required
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                name="lop"
                label="Lớp"
                fullWidth
                value={formData.lop}
                onChange={handleChange}
                required
                />
            </Grid>

            <Grid item xs={12}>
                <TextField
                select
                name="idTuyen"
                label="Tuyến xe"
                fullWidth
                value={formData.idTuyen}
                onChange={handleChange}
                >
                {routes.map((r) => (
                    <MenuItem key={r.idTuyenDuong || r.idTuyen} value={r.idTuyenDuong || r.idTuyen}>
                    {r.tenTuyen}
                    </MenuItem>
                ))}
                </TextField>
            </Grid>

            <Grid item xs={12}>
                <TextField
                select
                name="idDiemDon"
                label="Điểm đón (Theo tuyến đã chọn)"
                fullWidth
                value={formData.idDiemDon}
                onChange={handleChange}
                disabled={formData.idTuyen === 0} // Khóa nếu chưa chọn tuyến
                >
                {routeStops.map((s) => (
                    <MenuItem key={s.idDiemDung} value={s.idDiemDung}>
                    {s.tenDiemDung}
                    </MenuItem>
                ))}
                </TextField>
            </Grid>

            <Grid item xs={12}>
                <TextField
                select
                name="idPhuHuynh"
                label="Phụ huynh"
                fullWidth
                value={formData.idPhuHuynh}
                onChange={handleChange}
                helperText="Chỉ hiển thị phụ huynh đang hoạt động"
                >
                <MenuItem value=""><em>-- Chọn phụ huynh --</em></MenuItem>
                {parents.map((p) => (
                    <MenuItem key={p.idPhuHuynh} value={p.idPhuHuynh}>
                    {p.hoTen} - {p.soDienThoai}
                    </MenuItem>
                ))}
                </TextField>
            </Grid>

            {/* <Grid item xs={12}>
                <TextField
                select
                name="trangThai"
                label="Trạng thái"
                fullWidth
                value={formData.trangThai}
                onChange={handleChange}
                >
                <MenuItem value={1} sx={{color: 'green'}}>Đi học</MenuItem>
                <MenuItem value={0} sx={{color: 'red'}}>Nghỉ học</MenuItem>
                </TextField>
            </Grid> */}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSubmit} variant="contained">
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  )
}
export default StudentDialog