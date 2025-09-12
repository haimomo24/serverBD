import express from "express";
import { getConnection } from "../config/db.js";

const router = express.Router();

// POST: tăng lượt truy cập
router.post("/", async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request().query(`
      UPDATE see
      SET view_count = view_count + 1
      WHERE id = 1
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
    const result = await pool.request().query(`
      SELECT view_count FROM see WHERE id = 1
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("❌ Lỗi khi lấy tổng lượt truy cập:", err);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu!" });
  }
});

// GET: xem chi tiết (debug)
router.get("/", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT * FROM see`);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách:", err);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách!" });
  }
});

export default router;
