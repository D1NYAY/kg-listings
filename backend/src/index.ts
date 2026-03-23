import express from "express";
import cors from "cors";
import path from "path";
import { listingsRouter } from "./routes/listings";
import { categoriesRouter } from "./routes/categories";
import { citiesRouter } from "./routes/cities";
import { imageRouter } from "./routes/image";

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check
app.get("/health", (_, res) => res.json({ ok: true }));

// API routes
app.use("/api/listings", listingsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/cities", citiesRouter);
app.use("/api/image", imageRouter);

// Serve uploaded images (MVP - локальные файлы)
const uploadsPath = path.join(__dirname, "..", "..", "..", "uploads");
app.use("/uploads", express.static(uploadsPath));

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
