"use client"

import { useState, useEffect } from "react"
import { Box, Card, CardContent, Typography, CircularProgress } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { studentService, routeService, parentService } from "../services/api"
import StudentDialog from "../components/StudentDialog"

const StudentsPage = () => {
  const [students, setStudents] = useState([])
  const [routes, setRoutes] = useState([])
  const [parents, setParents] = useState([])
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
      console.log("[v0] Loading students data...")
      const [studentRes, routeRes, parentRes] = await Promise.all([
        studentService.getAll(),
        routeService.getAll(),
        parentService.getAll(),
      ])

      console.log("[v0] Student response:", studentRes.data)
      console.log("[v0] Route response:", routeRes.data)
      console.log("[v0] Parent response:", parentRes.data)

      const studentsData = Array.isArray(studentRes.data) ? studentRes.data : studentRes.data?.data || []
      const routesData = Array.isArray(routeRes.data) ? routeRes.data : routeRes.data?.data || []
      const parentsData = Array.isArray(parentRes.data) ? parentRes.data : parentRes.data?.data || []

      console.log("[v0] Processed students:", studentsData.length)
      console.log("[v0] Processed routes:", routesData.length)
      console.log("[v0] Processed parents:", parentsData.length)

      setStudents(studentsData)
      setRoutes(routesData)
      setParents(parentsData)
    } catch (error) {
      console.error("[v0] Failed to load data:", error)
      console.error("[v0] Error details:", error.response?.data)
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
        alert("Không thể xóa học sinh")
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
    } catch (error) {
      console.error("[v0] Failed to save student:", error)
      alert("Không thể lưu thông tin học sinh: " + (error.response?.data?.message || error.message))
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
                      <td>{student.diemDon || "-"}</td>
                      <td>
                        <span
                          className={
                            student.trangThai === 1 || student.trangThai === "Hoạt động"
                              ? "chip-active"
                              : "chip-inactive"
                          }
                        >
                          {student.trangThai === 1 || student.trangThai === "Hoạt động" ? "Hoạt động" : "Dừng"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          <button className="admin-btn-edit" onClick={() => handleEdit(student)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                            Sửa
                          </button>
                          <button className="admin-btn-delete" onClick={() => handleDelete(student.idHocSinh)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                            Xóa
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
        parents={parents}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  )
}

export default StudentsPage
