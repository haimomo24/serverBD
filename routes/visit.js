import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getConnection } from "../config/db.js";

const router = express.Router();

// Multer: lưu file an toàn
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "visit");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, Date.now() + "-" + safeName);
  }
});
const upload = multer({ storage });

// ================= POST visit =================
router.post("/", upload.fields([
  { name: "images_1" },
  { name: "images_2" },
  { name: "image_3" },
  { name: "images_4" },
  { name: "images_5" }
]), async (req, res) => {
  try {
    const { name, title_1, title_2, title_3, title_4, title_5 } = req.body;
    if (!name) return res.status(400).json({ error: "Thiếu name" });

    const images_1 = req.files["images_1"] ? req.files["images_1"][0].filename : null;
    const images_2 = req.files["images_2"] ? req.files["images_2"][0].filename : null;
    const image_3 = req.files["image_3"] ? req.files["image_3"][0].filename : null;
    const images_4 = req.files["images_4"] ? req.files["images_4"][0].filename : null;
    const images_5 = req.files["images_5"] ? req.files["images_5"][0].filename : null;

    const pool = await getConnection();
    await pool.request()
      .input("name", name)
      .input("title_1", title_1 || null)
      .input("title_2", title_2 || null)
      .input("title_3", title_3 || null)
      .input("title_4", title_4 || null)
      .input("title_5", title_5 || null)
      .input("images_1", images_1)
      .input("images_2", images_2)
      .input("image_3", image_3)
      .input("images_4", images_4)
      .input("images_5", images_5)
      .query(`
        INSERT INTO visit (name, title_1, title_2, title_3, title_4, title_5, images_1, images_2, image_3, images_4, images_5)
        VALUES (@name, @title_1, @title_2, @title_3, @title_4, @title_5, @images_1, @images_2, @image_3, @images_4, @images_5)
      `);

    res.status(201).json({ message: "Thêm visit thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi thêm visit" });
  }
});

// ================= GET visit =================
router.get("/", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM visit ORDER BY id DESC");

    const visits = result.recordset.map(item => ({
      ...item,
      images_1: item.images_1 ? `/uploads/visit/${item.images_1}` : null,
      images_2: item.images_2 ? `/uploads/visit/${item.images_2}` : null,
      image_3: item.image_3 ? `/uploads/visit/${item.image_3}` : null,
      images_4: item.images_4 ? `/uploads/visit/${item.images_4}` : null,
      images_5: item.images_5 ? `/uploads/visit/${item.images_5}` : null,
    }));

    res.json(visits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu visit" });
  }
});

// ================= Update visit =================


// ================= DELETE visit =================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input("id", id)
      .query("SELECT images_1, images_2, image_3, images_4, images_5 FROM visit WHERE id = @id");

    if (result.recordset.length === 0) return res.status(404).json({ error: "Visit không tồn tại" });

    const visit = result.recordset[0];

    ["images_1", "images_2", "image_3", "images_4", "images_5"].forEach(field => {
      if (visit[field]) {
        const filePath = path.join(process.cwd(), "uploads", "visit", visit[field]);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    await pool.request()
      .input("id", id)
      .query("DELETE FROM visit WHERE id = @id");

    res.json({ message: "Xoá visit thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi xoá visit" });
  }
});

export default router;
