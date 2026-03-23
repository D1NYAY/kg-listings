import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { getState, clearState, isAdminDeleteAwaitingId } from "./state";
import { handleStart, MENU_BUTTONS, mainMenuKeyboard } from "./handlers/start";
import {
  handleSubmitStart,
  handleSubmitText,
  handleSubmitPhoto,
  handleSubmitPhotoDone,
  handleSubmitPhotoAdd,
  handleSubmitPhotoCancel,
  handleCategorySelect,
  handleConfirmSubmit,
  getSubmitStep,
} from "./handlers/submit";
import { handleMyListings } from "./handlers/mylistings";
import {
  handleDeleteStart,
  handleDeleteSelect,
  handleDeleteConfirm,
  handleDeleteCancel,
} from "./handlers/delete";
import {
  handleAdminDeleteStart,
  handleAdminDeleteById,
  handleAdminDeleteByList,
  handleAdminDeleteSelect,
  handleAdminDeleteConfirm,
  handleAdminDeleteCancel,
  handleAdminDeleteIdInput,
} from "./handlers/admindelete";
import { approveListing, rejectListing } from "./utils/moderation";
import { isAdmin } from "./utils/admin";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}

const bot = new Telegraf(token);

const BOT_COMMANDS = [
  { command: "start", description: "Главное меню" },
  { command: "submit", description: "Подать объявление" },
  { command: "mylistings", description: "Мои объявления" },
  { command: "delete", description: "Удалить объявление" },
  { command: "help", description: "Справка" },
  { command: "cancel", description: "Отменить действие" },
];

bot.command("start", handleStart);
bot.command("help", async (ctx) => {
  await ctx.reply(
    "📖 *Справка*\n\n" +
      "/start — Главное меню\n" +
      "/submit — Подать объявление\n" +
      "/mylistings — Мои объявления\n" +
      "/delete — Удалить объявление\n" +
      "/cancel — Отменить текущее действие\n\n" +
      "Поддержка: @support (замените на ваш контакт)",
    { parse_mode: "Markdown" }
  );
});
bot.command("cancel", async (ctx) => {
  const chatId = ctx.chat?.id ?? 0;
  const wasInFlow = getSubmitStep(chatId) >= 0;
  clearState(chatId);
  await ctx.reply(
    wasInFlow ? "Создание объявления отменено." : "Действие отменено.",
    mainMenuKeyboard
  );
});

bot.command("submit", handleSubmitStart);
bot.command("mylistings", handleMyListings);
bot.command("delete", handleDeleteStart);
bot.command("admindelete", handleAdminDeleteStart);

bot.on("callback_query", async (ctx) => {
  const cb = ctx.callbackQuery;
  const data = cb && "data" in cb ? cb.data : undefined;
  if (!data) return;

  if (data === "submit") {
    await ctx.answerCbQuery();
    await handleSubmitStart(ctx);
    return;
  }
  if (data === "mylistings") {
    await ctx.answerCbQuery();
    await handleMyListings(ctx);
    return;
  }
  if (data.startsWith("cat_")) {
    await handleCategorySelect(ctx, data.replace("cat_", ""));
    return;
  }
  if (data === "submit_photo_done") {
    await handleSubmitPhotoDone(ctx);
    return;
  }
  if (data === "submit_photo_add") {
    await handleSubmitPhotoAdd(ctx);
    return;
  }
  if (data === "submit_photo_cancel") {
    await handleSubmitPhotoCancel(ctx);
    return;
  }
  if (data === "confirm_submit") {
    await handleConfirmSubmit(ctx);
    return;
  }
  if (data === "cancel_submit") {
    const { cancelSubmitFlow } = await import("./handlers/submit");
    await cancelSubmitFlow(ctx, true);
    return;
  }
  if (data.startsWith("delete_select_")) {
    await handleDeleteSelect(ctx, data.replace("delete_select_", ""));
    return;
  }
  if (data.startsWith("delete_confirm_")) {
    await handleDeleteConfirm(ctx, data.replace("delete_confirm_", ""));
    return;
  }
  if (data === "delete_cancel") {
    await handleDeleteCancel(ctx);
    return;
  }
  if (data === "admindelete_by_id") {
    await handleAdminDeleteById(ctx);
    return;
  }
  if (data === "admindelete_by_list") {
    await handleAdminDeleteByList(ctx);
    return;
  }
  if (data.startsWith("admindelete_select_")) {
    await handleAdminDeleteSelect(ctx, data.replace("admindelete_select_", ""));
    return;
  }
  if (data.startsWith("admindelete_confirm_")) {
    await handleAdminDeleteConfirm(ctx, data.replace("admindelete_confirm_", ""));
    return;
  }
  if (data === "admindelete_cancel") {
    await handleAdminDeleteCancel(ctx);
    return;
  }
  if (data.startsWith("approve_")) {
    const listingId = data.replace("approve_", "");
    if (!isAdmin(ctx.from?.id ?? 0)) {
      await ctx.answerCbQuery("Нет доступа", { show_alert: true });
      return;
    }
    await approveListing(ctx.telegram, listingId, ctx.from!.id);
    await ctx.answerCbQuery("Одобрено");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    return;
  }
  if (data.startsWith("reject_")) {
    const listingId = data.replace("reject_", "");
    if (!isAdmin(ctx.from?.id ?? 0)) {
      await ctx.answerCbQuery("Нет доступа", { show_alert: true });
      return;
    }
    await rejectListing(ctx.telegram, listingId, ctx.from!.id);
    await ctx.answerCbQuery("Отклонено");
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    return;
  }
});

bot.on(message("photo"), async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const step = getSubmitStep(chatId);
  if (step === 1) {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    await handleSubmitPhoto(ctx, photo.file_id);
  }
});

bot.on(message("text"), async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const text = ctx.message.text;

  if (isAdminDeleteAwaitingId(chatId)) {
    await handleAdminDeleteIdInput(ctx, text);
    return;
  }

  const step = getSubmitStep(chatId);
  if (step >= 0) {
    await handleSubmitText(ctx, text);
    return;
  }

  // Обработка кнопок меню
  switch (text) {
    case MENU_BUTTONS.submit:
      await handleSubmitStart(ctx);
      break;
    case MENU_BUTTONS.mylistings:
      await handleMyListings(ctx);
      break;
    case MENU_BUTTONS.delete:
      await handleDeleteStart(ctx);
      break;
    case MENU_BUTTONS.help:
      await ctx.reply(
        "📖 *Справка*\n\n" +
          "/start — Главное меню\n" +
          "/submit — Подать объявление\n" +
          "/mylistings — Мои объявления\n" +
          "/delete — Удалить объявление\n" +
          "/cancel — Отменить текущее действие\n\n" +
          "Поддержка: @support (замените на ваш контакт)",
        { parse_mode: "Markdown" }
      );
      break;
    default:
      break;
  }
});

bot.launch().then(async () => {
  try {
    await bot.telegram.setMyCommands(BOT_COMMANDS);
    console.log("Bot commands registered");
  } catch (e) {
    console.warn("Failed to set bot commands:", e);
  }
  console.log("Bot started");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
