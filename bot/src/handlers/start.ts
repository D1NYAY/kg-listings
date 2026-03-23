import { Context } from "telegraf";
import { Markup } from "telegraf";
import { clearState } from "../state";

export const MENU_BUTTONS = {
  submit: "📦 Подать объявление",
  mylistings: "📋 Мои объявления",
  delete: "🗑 Удалить объявление",
  help: "❓ Помощь",
  cancel: "❌ Отменить",
} as const;

export const mainMenuKeyboard = Markup.keyboard([
  [MENU_BUTTONS.submit],
  [MENU_BUTTONS.mylistings, MENU_BUTTONS.delete],
  [MENU_BUTTONS.help],
])
  .resize()
  .persistent();

/** Клавиатура во время подачи объявления — кнопка «Отменить» */
export const submitFlowKeyboard = Markup.keyboard([[MENU_BUTTONS.cancel]])
  .resize()
  .persistent();

export async function handleStart(ctx: Context) {
  clearState(ctx.chat?.id ?? 0);
  const name = ctx.from?.first_name || "пользователь";
  await ctx.reply(
    `👋 Здравствуйте, ${name}!\n\n` +
      `Я бот объявлений KG Listings для Кыргызстана.\n\n` +
      `Вы можете:\n` +
      `• Подать объявление — кнопка ниже или /submit\n` +
      `• Посмотреть свои объявления — /mylistings\n` +
      `• Удалить объявление — /delete\n` +
      `• Справка — /help\n` +
      `• Отменить действие — /cancel\n\n` +
      `Каталог объявлений открывается в Mini App 👇`,
    mainMenuKeyboard
  );
}
