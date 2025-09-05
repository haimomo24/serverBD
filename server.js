import express from "express";
import cors from "cors";
import path from "path"; 
import blogRoutes from "./routes/blog.js";
import visitRoutes from "./routes/visit.js";
import authRoutes from "./routes/auth.js";
import promotionRoutes from "./routes/promotion.js";

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// Serve ảnh tĩnh
app.use("/uploads/blogs", express.static(path.join(process.cwd(), "uploads", "blogs")));
app.use("/uploads/visit", express.static(path.join(process.cwd(), "uploads", "visit")));
app.use("/uploads/promotions", express.static(path.join(process.cwd(), "uploads", "promotions"))); // 👈 thêm dòng này

// Routes
app.use("/api/blog", blogRoutes);
app.use("/api/visit", visitRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/promotion", promotionRoutes); 

app.listen(4000, () => console.log("Server running on http://localhost:4000"));
