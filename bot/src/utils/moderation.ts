import { Telegram } from "telegraf";
import { prisma } from "../prisma";
import { getAdminIds } from "./admin";

function getFirstPhotoFileId(listing: {
  photoFileId: string | null;
  images?: { fileId: string }[];
}): string | null {
  const firstImage = listing.images?.[0];
  if (firstImage) return firstImage.fileId;
  return listing.photoFileId;
}

export async function sendToAdminForModeration(telegram: Telegram, listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { category: true, user: true, images: { orderBy: { order: "asc" } } },
  });
  if (!listing) return;

  const miniAppUrl = process.env.MINI_APP_URL || "http://localhost:3000";
  const text =
    "🆕 *Новое объявление на модерацию*\n\n" +
    `📌 ${listing.title}\n` +
    `💰 ${listing.price} ${listing.currency}\n` +
    `📂 ${listing.category.name} | ${listing.city}\n` +
    `👤 ${listing.sellerName}\n` +
    `📝 ${listing.description.slice(0, 150)}${listing.description.length > 150 ? "..." : ""}\n\n` +
    `ID: \`${listingId}\``;

  const buttons = [
    [
      { text: "✅ Одобрить", callback_data: `approve_${listingId}` },
      { text: "❌ Отклонить", callback_data: `reject_${listingId}` },
    ],
  ];

  const photoFileId = getFirstPhotoFileId(listing);
  const adminIds = getAdminIds();
  for (const adminId of adminIds) {
    try {
      if (photoFileId) {
        await telegram.sendPhoto(adminId, photoFileId, {
          caption: text,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: buttons },
        });
      } else {
        await telegram.sendMessage(adminId, text, {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: buttons },
        });
      }
    } catch (e) {
      console.error("Failed to send to admin", adminId, e);
    }
  }
}

export async function approveListing(telegram: Telegram, listingId: string, adminId: number) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { category: true, images: { orderBy: { order: "asc" } } },
  });
  if (!listing) return;
  if (listing.status !== "PENDING") return;

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "APPROVED", approvedAt: new Date() },
  });

  await prisma.adminAction.create({
    data: { listingId, adminId: BigInt(adminId), action: "approve" },
  });

  const channelId = process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_CHAT_ID;
  const miniAppUrl = process.env.MINI_APP_URL || "http://localhost:3000";

  const channelText =
    `${listing.title}\n\n` +
    `💰 ${listing.price} ${listing.currency}\n` +
    `📂 ${listing.category.name} | ${listing.city}\n` +
    `👤 ${listing.sellerName}\n\n` +
    `${listing.description.slice(0, 200)}${listing.description.length > 200 ? "..." : ""}`;

  const channelButtons = [
    [{ text: "📋 Смотреть в каталоге", url: `${miniAppUrl}/listing/${listingId}` }],
  ];

  const photoFileId = getFirstPhotoFileId(listing);
  if (channelId) {
    try {
      if (photoFileId) {
        await telegram.sendPhoto(channelId, photoFileId, {
          caption: channelText,
          reply_markup: { inline_keyboard: channelButtons },
        });
      } else {
        await telegram.sendMessage(channelId, channelText, {
          reply_markup: { inline_keyboard: channelButtons },
        });
      }
    } catch (e) {
      console.error("Failed to publish to channel:", e);
    }
  }

  const user = await prisma.user.findUnique({ where: { id: listing.userId } });
  if (user) {
    try {
      await telegram.sendMessage(
        Number(user.telegramId),
        `✅ Ваше объявление «${listing.title}» одобрено и опубликовано!`
      );
    } catch {
      // User might have blocked the bot
    }
  }
}

export async function rejectListing(telegram: Telegram, listingId: string, adminId: number) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return;
  if (listing.status !== "PENDING") return;

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "REJECTED", rejectedAt: new Date() },
  });

  await prisma.adminAction.create({
    data: { listingId, adminId: BigInt(adminId), action: "reject" },
  });

  const user = await prisma.user.findUnique({ where: { id: listing.userId } });
  if (user) {
    try {
      await telegram.sendMessage(
        Number(user.telegramId),
        `❌ К сожалению, ваше объявление «${listing.title}» было отклонено модератором.`
      );
    } catch {
      // User might have blocked the bot
    }
  }
}
