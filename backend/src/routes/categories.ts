import { Router } from "express";
import { prisma } from "../prisma";

export const categoriesRouter = Router();

// GET /api/categories
categoriesRouter.get("/", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    console.error("Categories fetch error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
