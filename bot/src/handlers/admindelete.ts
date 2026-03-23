import { Context } from "telegraf";
import { prisma } from "../prisma";
import { isAdmin } from "../utils/admin";
import { mainMenuKeyboard, MENU_BUTTONS } from "./start";
import { setAdminDeleteAwaitingId } from "../state";

const STATUS_EMOJI: Record<string, string> = {
  PENDING: "⏳",
  APPROVED: "✅",
  REJECTED: "❌",
};

export async function handleAdminDeleteStart(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !isAdmin(telegramId)) {
    await ctx.reply("Эта команда доступна только администратору.");
    return;
  }

  await ctx.reply("Выберите способ удаления объявления:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "1. Удалить по ID объявления", callback_data: "admindelete_by_id" }],
        [{ text: "2. Показать последние 10 объявлений", callback_data: "admindelete_by_list" }],
        [{ text: "Отмена", callback_data: "admindelete_cancel" }],
      ],
    },
  });
}

export async function handleAdminDeleteById(ctx: Context) {
  if (!isAdmin(ctx.from?.id ?? 0)) {
    await ctx.answerCbQuery("Нет доступа", { show_alert: true });
    return;
  }
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  setAdminDeleteAwaitingId(chatId, true);
  await ctx.answerCbQuery();
  await ctx.reply("Введите ID объявления (cuid):", mainMenuKeyboard);
}

export async function handleAdminDeleteByList(ctx: Context) {
  if (!isAdmin(ctx.from?.id ?? 0)) {
    await ctx.answerCbQuery("Нет доступа", { show_alert: true });
    return;
  }

  const listings = await prisma.listing.findMany({
    where: { status: { not: "DELETED" } },
    include: { user: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (listings.length === 0) {
    await ctx.answerCbQuery();
    await ctx.reply("Нет объявлений для удаления.");
    return;
  }

  const buttons = listings.map((l) => [
    {
      text: `${l.id.slice(0, 8)} | ${l.title.slice(0, 15)}${l.title.length > 15 ? "…" : ""} | ${l.user.firstName ?? "-"} | ${l.status}`,
      callback_data: `admindelete_select_${l.id}`,
    },
  ]);
  buttons.push([{ text: "Отмена", callback_data: "admindelete_cancel" }]);

  await ctx.answerCbQuery();
  await ctx.reply("Последние 10 объявлений (ID | название | продавец | статус):", {
    reply_markup: { inline_keyboard: buttons },
  });
}

export async function handleAdminDeleteSelect(ctx: Context, listingId: string) {
  if (!isAdmin(ctx.from?.id ?? 0)) {
    await ctx.answerCbQuery("Нет доступа", { show_alert: true });
    return;
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: { not: "DELETED" } },
  });

  if (!listing) {
    await ctx.answerCbQuery("Объявление не найдено", { show_alert: true });
    return;
  }

  await ctx.answerCbQuery();
  await ctx.reply(`Удалить объявление «${listing.title}»?`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Да, удалить", callback_data: `admindelete_confirm_${listingId}` }],
        [{ text: "Отмена", callback_data: "admindelete_cancel" }],
      ],
    },
  });
}

export async function handleAdminDeleteConfirm(ctx: Context, listingId: string) {
  if (!isAdmin(ctx.from?.id ?? 0)) {
    await ctx.answerCbQuery("Нет доступа", { show_alert: true });
    return;
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: { not: "DELETED" } },
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
  await ctx.reply("Объявление удалено.");
}

export async function handleAdminDeleteCancel(ctx: Context) {
  await ctx.answerCbQuery();
  await ctx.reply("Отменено.", mainMenuKeyboard);
}

/** Обработка ввода ID для admindelete (вызывается из text handler при специальном состоянии) */
export async function handleAdminDeleteIdInput(ctx: Context, listingId: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  setAdminDeleteAwaitingId(chatId, false);

  if (listingId.trim() === MENU_BUTTONS.cancel) {
    await ctx.reply("Отменено.", mainMenuKeyboard);
    return;
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId.trim(), status: { not: "DELETED" } },
  });

  if (!listing) {
    await ctx.reply("Объявление с таким ID не найдено. Попробуйте снова или /cancel.");
    return;
  }

  await ctx.reply(`Удалить объявление «${listing.title}»?`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Да, удалить", callback_data: `admindelete_confirm_${listing.id}` }],
        [{ text: "Отмена", callback_data: "admindelete_cancel" }],
      ],
    },
  });
}
