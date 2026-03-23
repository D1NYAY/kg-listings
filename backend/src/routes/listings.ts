import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { z } from "zod";
import { isAdmin } from "../utils/admin";

export const listingsRouter = Router();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  category: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
});

// GET /api/listings — только одобренные объявления
listingsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    }
    const { page, limit, category, city, search } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: "APPROVED" };
    if (category) where.categoryId = category;
    if (city) where.city = city;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rawListings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { category: true, images: { orderBy: { order: "asc" } } },
        orderBy: { approvedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    const listings = rawListings.map((l) => ({
      ...l,
      price: Number(l.price),
    }));

    res.json({
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Listings fetch error:", err);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// DELETE /api/listings/:id — мягкое удаление (только владелец или админ)
// Требует заголовок X-Telegram-User-Id с telegram ID пользователя
listingsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const telegramIdRaw = req.headers["x-telegram-user-id"];
    const telegramId =
      typeof telegramIdRaw === "string" ? telegramIdRaw : Array.isArray(telegramIdRaw) ? telegramIdRaw[0] : null;

    if (!telegramId) {
      return res.status(401).json({ error: "X-Telegram-User-Id required" });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.status === "DELETED") {
      return res.status(400).json({ error: "Listing already deleted" });
    }

    const isOwner = listing.user.telegramId.toString() === telegramId;
    const isAdminUser = isAdmin(telegramId);

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ error: "Вы не можете удалить это объявление." });
    }

    await prisma.listing.update({
      where: { id },
      data: { status: "DELETED" },
    });

    res.json({ ok: true, message: "Объявление удалено." });
  } catch (err) {
    console.error("Delete listing error:", err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

// GET /api/listings/:id — одно объявление
listingsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findFirst({
      where: { id, status: "APPROVED" },
      include: { category: true, images: { orderBy: { order: "asc" } } },
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json({ ...listing, price: Number(listing.price) });
  } catch (err) {
    console.error("Listing fetch error:", err);
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});
