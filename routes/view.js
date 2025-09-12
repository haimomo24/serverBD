import express from "express";
import { getConnection } from "../config/db.js"; 

const router = express.Router();

// POST: ghi lượt truy cập
router.post("/", async (req, res) => {
  try {
    const pool = await getConnection();
    // ✅ Chèn dữ liệu với thời gian hiện tại
    await pool.request().query(`
      INSERT INTO [view] (visit_time)
      VALUES (GETDATE())
    `);
    res.status(201).json({ message: "Ghi nhận lượt truy cập thành công!" });
  } catch (err) {
    console.error("❌ Lỗi khi ghi lượt truy cập:", err);
    res.status(500).json({ error: "Lỗi server khi ghi lượt truy cập!" });
  }
});

// GET: tổng lượt truy cập
router.get("/total", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .query(`SELECT COUNT(*) AS total_views FROM [view]`);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Lỗi khi lấy tổng lượt truy cập:", err);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu!" });
  }
});

// GET: thống kê theo ngày
router.get("/by-date", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT CAST(visit_time AS DATE) AS [date], COUNT(*) AS views
      FROM [view]
      GROUP BY CAST(visit_time AS DATE)
      ORDER BY [date] DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi khi thống kê dữ liệu:", err);
    res.status(500).json({ error: "Lỗi server khi thống kê dữ liệu!" });
  }
});

// GET: danh sách tất cả lượt truy cập
router.get("/", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT * FROM [view] ORDER BY visit_time DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách lượt truy cập:", err);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách lượt truy cập!" });
  }
});

export default router;
