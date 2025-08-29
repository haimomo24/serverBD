import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getConnection } from "../config/db.js";

const router = express.Router();

// Multer: lưu ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "blogs");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// POST: thêm blog
router.post("/", upload.fields([{ name: "images_1" }, { name: "images_2" }]), async (req, res) => {
  try {
    const { name, title_1, title_2, title_3 } = req.body;
    if (!name) return res.status(400).json({ error: "Thiếu name" });

    const images_1 = req.files["images_1"] ? req.files["images_1"][0].filename : null;
    const images_2 = req.files["images_2"] ? req.files["images_2"][0].filename : null;

    const pool = await getConnection();
    await pool.request()
      .input("name", name)
      .input("images_1", images_1)
      .input("images_2", images_2)
      .input("title_1", title_1 || null)
      .input("title_2", title_2 || null)
      .input("title_3", title_3 || null)
      .query(`
        INSERT INTO blog (name, images_1, images_2, title_1, title_2, title_3)
        VALUES (@name, @images_1, @images_2, @title_1, @title_2, @title_3)
      `);

    res.status(201).json({ message: "Thêm blog thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi thêm blog!" });
  }
});

// GET: lấy danh sách blog
router.get("/", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM blog ORDER BY id DESC");

    const blogs = result.recordset.map(item => ({
      ...item,
      images_1: item.images_1 ? `${req.protocol}://${req.get("host")}/uploads/blogs/${item.images_1}` : null,
      images_2: item.images_2 ? `${req.protocol}://${req.get("host")}/uploads/blogs/${item.images_2}` : null,
    }));

    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu!" });
  }
});

// GET: lấy blog theo id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input("id", id)
      .query("SELECT * FROM blog WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Blog không tồn tại" });
    }

    const blog = result.recordset[0];
    blog.images_1 = blog.images_1 ? `${req.protocol}://${req.get("host")}/uploads/blogs/${blog.images_1}` : null;
    blog.images_2 = blog.images_2 ? `${req.protocol}://${req.get("host")}/uploads/blogs/${blog.images_2}` : null;

    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi lấy blog!" });
  }
});

// DELETE: xoá blog theo id và xóa ảnh trong folder
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Lấy thông tin blog để biết tên ảnh
    const result = await pool.request()
      .input("id", id)
      .query("SELECT images_1, images_2 FROM blog WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Blog không tồn tại" });
    }

    const blog = result.recordset[0];

    // Hàm xóa ảnh
    const deleteImage = (filename) => {
      if (filename) {
        const filePath = path.join(process.cwd(), "uploads", "blogs", filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Đã xóa file:", filePath);
        }
      }
    };

    deleteImage(blog.images_1);
    deleteImage(blog.images_2);

    // Xoá blog khỏi database
    await pool.request()
      .input("id", id)
      .query("DELETE FROM blog WHERE id = @id");

    res.json({ message: "Xoá blog thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server khi xoá blog!" });
  }
});

export default router;
