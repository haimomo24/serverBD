\import express from "express";
import { getConnection } from "../db.js";

const router = express.Router();

// Tăng lượt xem
router.post("/", async (req, res) => {
  try {
    const pool = await getConnection();

    // Kiểm tra nếu chưa có row id=1 thì insert
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM see WHERE id = 1)
      BEGIN
        INSERT INTO see (id, view_count) VALUES (1, 0)
      END
    `);

    // Cập nhật +1 lượt xem
    await pool.request().query(`
      UPDATE see SET view_count = view_count + 1 WHERE id = 1
    `);

    res.json({ message: "✅ Đã tăng lượt xem" });
  } catch (err) {
    console.error("❌ Lỗi tăng view:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Lấy tổng lượt xem
router.get("/total", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(
      "SELECT view_count FROM see WHERE id = 1"
    );

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Lỗi lấy tổng view:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
