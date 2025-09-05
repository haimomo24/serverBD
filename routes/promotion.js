import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getConnection } from "../config/db.js";

const router = express.Router();

// Multer: lưu ảnh promotion
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "promotions");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ================== API ==================

// POST: thêm promotion
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, unit, price_1, price_2, title } = req.body;
    if (!name) return res.status(400).json({ error: "Thiếu name" });

    const image = req.file ? req.file.filename : null;

    const pool = await getConnection();
    await pool.request()
      .input("name", name)
      .input("image", image)
      .input("description", description || null)
      .input("unit", unit || null)
      .input("price_1", price_1 || null)
      .input("price_2", price_2 || null)
      .input("title", title || null)
      .query(`
        INSERT INTO promotion (name, image, description, unit, price_1, price_2, title)
        VALUES (@name, @image, @description, @unit, @price_1, @price_2, @title)
      `);

    res.status(201).json({ message: "Thêm promotion thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi thêm promotion!" });
  }
});

// GET: lấy danh sách promotion
router.get("/", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM promotion ORDER BY id DESC");

    const promotions = result.recordset.map(item => ({
      ...item,
      image: item.image ? `${req.protocol}://${req.get("host")}/uploads/promotions/${item.image}` : null,
    }));

    res.json(promotions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu!" });
  }
});

// GET: lấy promotion theo id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input("id", id)
      .query("SELECT * FROM promotion WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Promotion không tồn tại" });
    }

    const promotion = result.recordset[0];
    promotion.image = promotion.image ? `${req.protocol}://${req.get("host")}/uploads/promotions/${promotion.image}` : null;

    res.json(promotion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi lấy promotion!" });
  }
});

// DELETE: xoá promotion theo id và xóa ảnh
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input("id", id)
      .query("SELECT image FROM promotion WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Promotion không tồn tại" });
    }

    const promotion = result.recordset[0];

    if (promotion.image) {
      const filePath = path.join(process.cwd(), "uploads", "promotions", promotion.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Đã xóa file:", filePath);
      }
    }

    await pool.request()
      .input("id", id)
      .query("DELETE FROM promotion WHERE id = @id");

    res.json({ message: "Xoá promotion thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi xoá promotion!" });
  }
});

// PUT: sửa promotion theo id
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unit, price_1, price_2, title } = req.body;

    const pool = await getConnection();

    // Lấy dữ liệu cũ để check ảnh
    const oldResult = await pool.request()
      .input("id", id)
      .query("SELECT image FROM promotion WHERE id = @id");

    if (oldResult.recordset.length === 0) {
      return res.status(404).json({ error: "Promotion không tồn tại" });
    }

    let image = oldResult.recordset[0].image;

    // Nếu có upload ảnh mới thì thay thế và xóa ảnh cũ
    if (req.file) {
      if (image) {
        const oldPath = path.join(process.cwd(), "uploads", "promotions", image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      image = req.file.filename;
    }

    await pool.request()
      .input("id", id)
      .input("name", name || null)
      .input("image", image || null)
      .input("description", description || null)
      .input("unit", unit || null)
      .input("price_1", price_1 || null)
      .input("price_2", price_2 || null)
      .input("title", title || null)
      .query(`
        UPDATE promotion
        SET name = @name,
            image = @image,
            description = @description,
            unit = @unit,
            price_1 = @price_1,
            price_2 = @price_2,
            title = @title
        WHERE id = @id
      `);

    res.json({ message: "Cập nhật promotion thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi cập nhật promotion!" });
  }
});

export default router;
