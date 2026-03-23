import { Context } from "telegraf";
import { prisma } from "../prisma";
import { getOrCreateUser } from "../utils/user";

const STATUS_EMOJI: Record<string, string> = {
  PENDING: "⏳",
  APPROVED: "✅",
  REJECTED: "❌",
};

export async function handleDeleteStart(ctx: Context) {
  const user = await getOrCreateUser(ctx.from!);
  const listings = await prisma.listing.findMany({
    where: {
      userId: user.id,
      status: { not: "DELETED" },
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (listings.length === 0) {
    await ctx.reply("У вас нет объявлений для удаления.");
    return;
  }

  const buttons = listings.map((l) => [
    {
      text: `${STATUS_EMOJI[l.status] || "•"} ${l.title} (${new Date(l.createdAt).toLocaleDateString("ru-RU")})`,
      callback_data: `delete_select_${l.id}`,
    },
  ]);

  await ctx.reply("Выберите объявление для удаления:", {
    reply_markup: { inline_keyboard: buttons },
  });
}

export async function handleDeleteSelect(ctx: Context, listingId: string) {
  const user = await getOrCreateUser(ctx.from!);

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, userId: user.id, status: { not: "DELETED" } },
  });

  if (!listing) {
    await ctx.answerCbQuery("Объявление не найдено", { show_alert: true });
    return;
  }

  await ctx.answerCbQuery();
  await ctx.reply(`Вы уверены, что хотите удалить объявление «${listing.title}»?`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Да, удалить", callback_data: `delete_confirm_${listingId}` }],
        [{ text: "Отмена", callback_data: "delete_cancel" }],
      ],
    },
  });
}

export async function handleDeleteConfirm(ctx: Context, listingId: string) {
  const user = await getOrCreateUser(ctx.from!);

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, userId: user.id, status: { not: "DELETED" } },
  });

  if (!listing) {
    await ctx.answerCbQuery("Объявление не найдено", { show_alert: true });
    return;
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "DELETED" },
  });

  await ctx.answerCbQuery();
  await ctx.reply(`Объявление «${listing.title}» удалено.`);
}

export async function handleDeleteCancel(ctx: Context) {
  await ctx.answerCbQuery();
  await ctx.reply("Удаление отменено.");
}
