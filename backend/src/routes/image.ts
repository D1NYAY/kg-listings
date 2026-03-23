import { Router } from "express";
import { prisma } from "../prisma";

export const imageRouter = Router();

async function streamTelegramFile(fileId: string, res: import("express").Response) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const tgRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
  );
  const data = (await tgRes.json()) as { ok: boolean; result?: { file_path: string } };
  if (!data.ok || !data.result) return false;
  const imgUrl = `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
  const imgRes = await fetch(imgUrl);
  if (!imgRes.ok) return false;
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  res.setHeader("Content-Type", imgRes.headers.get("content-type") || "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(buffer);
  return true;
}

// GET /api/image/:listingId/:index — конкретное фото по индексу (0, 1, 2)
imageRouter.get("/:listingId/:index", async (req, res) => {
  try {
    const { listingId, index } = req.params;
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0) {
      return res.status(400).json({ error: "Invalid index" });
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: "APPROVED" },
      include: { images: { orderBy: { order: "asc" } } },
    });
    if (!listing) return res.status(404).json({ error: "Not found" });

    const images = listing.images;
    let fileId: string | null = null;

    if (images.length > 0 && idx < images.length) {
      fileId = images[idx].fileId;
    } else if (idx === 0 && listing.photoFileId) {
      fileId = listing.photoFileId;
    }

    if (!fileId) return res.status(404).json({ error: "No photo" });

    const sent = await streamTelegramFile(fileId, res);
    if (!sent) res.status(502).json({ error: "Failed to load image" });
  } catch {
    res.status(500).json({ error: "Failed to load image" });
  }
});

// GET /api/image/:listingId — первое фото (обратная совместимость)
imageRouter.get("/:listingId", async (req, res) => {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: req.params.listingId, status: "APPROVED" },
      include: { images: { orderBy: { order: "asc" } } },
    });
    if (!listing) return res.status(404).json({ error: "Not found" });

    if (listing.photoUrl) {
      return res.redirect(listing.photoUrl);
    }

    const fileId =
      listing.images[0]?.fileId ?? listing.photoFileId;
    if (!fileId) return res.status(404).json({ error: "No photo" });

    const sent = await streamTelegramFile(fileId, res);
    if (!sent) res.status(502).json({ error: "Failed to load image" });
  } catch {
    res.status(500).json({ error: "Failed to load image" });
  }
});
