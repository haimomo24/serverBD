// routes/auth.js
import express from "express";
import { getConnection } from "../config/db.js";

const router = express.Router();

// API Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Thiếu username hoặc password" });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("username", username)
      .query("SELECT * FROM users WHERE username = @username");

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
    }

    const user = result.recordset[0];

    // Kiểm tra password
    if (user.password !== password) {
      return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
    }

    
    const fakeToken = `token_${user.id}_${Date.now()}`;

    
    res.json({
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
      },
      token: fakeToken, // có thể thay bằng JWT thật sau
      loginTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Lỗi login:", err);
    res.status(500).json({ error: "Lỗi server khi đăng nhập" });
  }
});

// API: Lấy danh sách tất cả user
router.get("/users", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT id, username, email, level FROM users");
    res.json(result.recordset);
  } catch (err) {
    console.error("Lỗi lấy danh sách users:", err);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách users" });
  }
});

// API: Xoá user theo id
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    await pool.request().input("id", id).query("DELETE FROM users WHERE id = @id");
    res.json({ message: "Xoá user thành công" });
  } catch (err) {
    console.error("Lỗi xoá user:", err);
    res.status(500).json({ error: "Lỗi server khi xoá user" });
  }
});

// API: Thêm user mới
router.post("/users", async (req, res) => {
  try {
    const { username, password, email, level } = req.body;

    if (!username || !password || !email || !level) {
      return res.status(400).json({ error: "Thiếu thông tin cần thiết" });
    }

    const pool = await getConnection();

    // Kiểm tra username đã tồn tại chưa
    const check = await pool
      .request()
      .input("username", username)
      .query("SELECT id FROM users WHERE username = @username");

    if (check.recordset.length > 0) {
      return res.status(400).json({ error: "Username đã tồn tại" });
    }

    // Thêm user
    await pool
      .request()
      .input("username", username)
      .input("password", password) // 🚨 chưa hash password
      .input("email", email)
      .input("level", level)
      .query(
        "INSERT INTO users (username, password, email, level) VALUES (@username, @password, @email, @level)"
      );

    res.json({ message: "Thêm user thành công" });
  } catch (err) {
    console.error("Lỗi thêm user:", err);
    res.status(500).json({ error: "Lỗi server khi thêm user" });
  }
});

export default router;
