import { useState, useEffect } from "react"
import { Box, Card, CardContent, Typography, CircularProgress } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { studentService, routeService, parentService } from "../services/api"
import StudentDialog from "../components/StudentDialog"
import '../styles/admin.css'

const StudentsPage = () => {
  const [students, setStudents] = useState([])
  const [routes, setRoutes] = useState([])
  const [activeParents, setActiveParents] = useState([]) // Đổi tên state để rõ nghĩa
  const [filteredStudents, setFilteredStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(
        (student) =>
          student.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.lop.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [searchTerm, students])

  const loadData = async () => {
    setLoading(true)
    try {
      const [studentRes, routeRes, parentRes] = await Promise.all([
        studentService.getAll(),
        routeService.getAll(),
        parentService.getAll(),
      ])

      const studentsData = Array.isArray(studentRes.data) ? studentRes.data : studentRes.data?.data || []
      const routesData = Array.isArray(routeRes.data) ? routeRes.data : routeRes.data?.data || []
      const allParents = Array.isArray(parentRes.data) ? parentRes.data : parentRes.data?.data || []

      // --- LỌC PHỤ HUYNH: Chỉ lấy người có trạng thái = 1 ---
      const filteredParents = allParents.filter(p => p.trangThai === 1 || p.trangThai === 'Hoạt động');

      setStudents(studentsData)
      setRoutes(routesData)
      setActiveParents(filteredParents) // Lưu danh sách đã lọc
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedStudent(null)
    setDialogOpen(true)
  }

  const handleEdit = (student) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa học sinh này?")) {
      try {
        await studentService.delete(id)
        loadData()
      } catch (error) {
        console.error("Failed to delete student:", error)
        alert("Không thể xóa học sinh: " + (error.response?.data?.message || error.message))
      }
    }
  }

  const handleSave = async (studentData) => {
    try {
      if (selectedStudent) {
        await studentService.update(selectedStudent.idHocSinh, studentData)
      } else {
        await studentService.create(studentData)
      }
      setDialogOpen(false)
      loadData()
      alert(selectedStudent ? 'Cập nhật thành công!' : 'Thêm mới thành công!')
    } catch (error) {
      console.error("Failed to save student:", error)
      alert("Lỗi: " + (error.response?.data?.message || error.message))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Danh sách học sinh</h1>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Quản lý thông tin học sinh và phụ huynh
          </Typography>
        </div>
        <button className="admin-btn-add" onClick={handleAdd}>
          <AddIcon sx={{ fontSize: 20 }} />
          Thêm học sinh
        </button>
      </div>

      <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
        <CardContent sx={{ p: 0 }}>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm kiếm theo tên hoặc lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: "20px" }}
          />

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Lớp</th>
                  <th>Tuyến xe</th>
                  <th>Điểm đón</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.idHocSinh}>
                      <td style={{ fontWeight: 600 }}>{student.hoTen}</td>
                      <td>{student.lop}</td>
                      <td>{student.tenTuyen || "Chưa phân công"}</td>
                      <td>{student.tenDiemDon || "-"}</td>
                      <td>
                        <span className={student.trangThai === 1 ? "chip-active" : "chip-inactive"}>
                          {student.trangThai === 1 ? "Đi học" : "Nghỉ học"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          <button className="admin-btn-edit" onClick={() => handleEdit(student)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </button>
                          <button className="admin-btn-delete" onClick={() => handleDelete(student.idHocSinh)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      Không có học sinh nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <StudentDialog
        open={dialogOpen}
        student={selectedStudent}
        routes={routes}
        parents={activeParents} // Truyền danh sách đã lọc vào đây
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  )
}

export default StudentsPage