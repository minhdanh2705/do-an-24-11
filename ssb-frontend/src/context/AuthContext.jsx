import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  
  // loading mặc định là TRUE để chặn App không redirect vội khi chưa check xong session
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

  // --- CHECK SESSION KHI LOAD TRANG ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authService.checkSession();
        if (res.data && res.data.success) {
          // Nếu backend bảo ok -> set user
          setUser(res.data.user);
        }
      } catch (err) {
        // Nếu lỗi (401) -> nghĩa là chưa đăng nhập -> không làm gì cả (user vẫn là null)
        console.log("Chưa đăng nhập hoặc hết phiên");
      } finally {
        // Dù thành công hay thất bại thì cũng báo là đã check xong
        setLoading(false);
      }
    };
    initAuth();
  }, []);
  // ------------------------------------

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password);
      // Lưu ý: response.data vì axios bọc data trong object data
      const data = response.data; 
      
      if (data.success) {
        setUser(data.user);
        return true;
      } else {
        setError(data.message || "Đăng nhập thất bại");
        return false;
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || err.message || "Lỗi kết nối server");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
        await authService.logout();
    } catch (error) {
        console.error("Logout error", error);
    }
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {/* Nếu đang check session (loading=true) thì không hiện gì cả để tránh nháy trang login */}
      {!loading && children} 
    </AuthContext.Provider>
  );
};