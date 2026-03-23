import { Context } from "telegraf";
import { prisma } from "../prisma";
import { getState, setState, clearState, type DraftListing } from "../state";
import { CITIES } from "../constants";
import { getOrCreateUser } from "../utils/user";
import { sendToAdminForModeration } from "../utils/moderation";
import { Markup } from "telegraf";
import { mainMenuKeyboard, submitFlowKeyboard, MENU_BUTTONS } from "./start";

function getCityKeyboard() {
  const rows: string[][] = [];
  for (let i = 0; i < CITIES.length; i += 3) {
    rows.push([...CITIES.slice(i, i + 3)]);
  }
  rows.push([MENU_BUTTONS.cancel]);
  return Markup.keyboard(rows).resize().persistent();
}

const MAX_ACTIVE_LISTINGS = 5;
const ACTIVE_STATUSES: ("PENDING" | "APPROVED")[] = ["PENDING", "APPROVED"];
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_PHOTOS = 3;

const STEPS = [
  "title",
  "photo",
  "description",
  "price",
  "category",
  "city",
  "contact",
  "sellerName",
  "confirm",
] as const;

export function getSubmitStep(chatId: number): number {
  const state = getState(chatId);
  return state?.step ?? -1;
}

export function getStepName(step: number): string {
  return STEPS[step] ?? "done";
}

/** Универсальная отмена подачи объявления — вызывать с любого шага */
export async function cancelSubmitFlow(ctx: Context, fromCallback = false) {
  const chatId = ctx.chat?.id ?? 0;
  clearState(chatId);
  if (fromCallback) {
    await ctx.answerCbQuery();
  }
  await ctx.reply("Создание объявления отменено.", mainMenuKeyboard);
}

export async function handleSubmitStart(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const user = await getOrCreateUser(ctx.from!);
  if (!user) {
    await ctx.reply("Ошибка при создании профиля. Попробуйте /start");
    return;
  }

  const activeCount = await prisma.listing.count({
    where: {
      userId: user.id,
      status: { in: ACTIVE_STATUSES },
    },
  });

  if (activeCount >= MAX_ACTIVE_LISTINGS) {
    await ctx.reply(
      "У вас уже есть 5 активных объявлений. Удалите одно из существующих, чтобы добавить новое."
    );
    return;
  }

  setState(chatId, { step: 0 });
  await ctx.reply(
    `📝 Подача объявления\n\nШаг 1/9: Введите *название товара* (до ${MAX_TITLE_LENGTH} символов):`,
    { parse_mode: "Markdown", ...submitFlowKeyboard }
  );
}

function getPhotoKeyboard(photoCount: number) {
  const row1: { text: string; callback_data: string }[] = [];
  if (photoCount < MAX_PHOTOS) {
    row1.push({ text: "➕ Добавить ещё фото", callback_data: "submit_photo_add" });
  }
  row1.push({ text: "✅ Готово", callback_data: "submit_photo_done" });
  row1.push({ text: "❌ Отмена", callback_data: "submit_photo_cancel" });
  return { inline_keyboard: [row1] };
}

export async function handleSubmitText(ctx: Context, text: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const state = getState(chatId);
  if (!state || state.step < 0) return;

  if (text === MENU_BUTTONS.cancel) {
    await cancelSubmitFlow(ctx, false);
    return;
  }

  switch (state.step) {
    case 0: {
      if (text.length > MAX_TITLE_LENGTH) {
        await ctx.reply("Название товара должно быть не длиннее 50 символов.");
        return;
      }
      setState(chatId, { ...state, step: 1, title: text.trim() });
      await ctx.reply(
        "Шаг 2/9: Отправьте *фото* товара (можно до 3 фото):",
        { parse_mode: "Markdown", ...submitFlowKeyboard }
      );
      break;
    }
    case 2: {
      if (text.length > MAX_DESCRIPTION_LENGTH) {
        await ctx.reply("Описание должно быть не длиннее 300 символов.");
        return;
      }
      setState(chatId, { ...state, step: 3, description: text.trim() });
      await ctx.reply("Шаг 4/9: Введите *цену* в сомах (KGS), только число:", submitFlowKeyboard);
      break;
    }
    case 3: {
      const priceNum = parseInt(text.replace(/\s/g, ""), 10);
      if (isNaN(priceNum) || priceNum < 1) {
        await ctx.reply("Введите корректную цену (целое положительное число):");
        return;
      }
      setState(chatId, { ...state, step: 4, price: String(priceNum) });
      const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
      const categoryButtons = categories.map((c) => [{ text: c.name, callback_data: `cat_${c.id}` }]);
      const cancelRow = [{ text: "❌ Отмена", callback_data: "cancel_submit" }];
      await ctx.reply("Шаг 5/9: Выберите *категорию*:", {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [...categoryButtons, cancelRow] },
      });
      break;
    }
    case 4:
      break;
    case 5: {
      const cityTrimmed = text.trim();
      if (!CITIES.includes(cityTrimmed as (typeof CITIES)[number])) {
        await ctx.reply("Пожалуйста, выберите город кнопкой ниже.", getCityKeyboard());
        return;
      }
      setState(chatId, { ...state, step: 6, city: cityTrimmed });
      await ctx.reply(
        "Шаг 7/9: Введите контакт для связи:\n" +
          "• @username в Telegram\n" +
          "• или номер телефона (например +996 XXX XXX XXX):",
        submitFlowKeyboard
      );
      break;
    }
    case 6: {
      const contact = text.trim();
      const isTg = contact.startsWith("@") || /^\d{10,15}$/.test(contact.replace(/\D/g, ""));
      if (!isTg && !contact.includes("+")) {
        await ctx.reply("Укажите @username или номер телефона с кодом страны:");
        return;
      }
      if (contact.startsWith("@")) {
        setState(chatId, { ...state, step: 7, contactTelegram: contact });
      } else {
        setState(chatId, { ...state, step: 7, contactPhone: contact });
      }
      await ctx.reply("Шаг 8/9: Введите ваше *имя* или отображаемое имя для объявления:", {
        parse_mode: "Markdown",
        ...submitFlowKeyboard,
      });
      break;
    }
    case 7: {
      if (text.length > 50) {
        await ctx.reply("Имя слишком длинное. Максимум 50 символов.");
        return;
      }
      setState(chatId, { ...state, step: 8, sellerName: text.trim() });
      await showConfirm(ctx, chatId, { ...state, sellerName: text.trim() });
      break;
    }
    default:
      break;
  }
}

async function showConfirm(ctx: Context, chatId: number, state: DraftListing) {
  const category = state.categoryId
    ? await prisma.category.findUnique({ where: { id: state.categoryId } })
    : null;
  const msg =
    "📋 *Подтвердите объявление*\n\n" +
    `• Название: ${state.title}\n` +
    `• Описание: ${state.description}\n` +
    `• Цена: ${state.price} KGS\n` +
    `• Категория: ${category?.name ?? "-"}\n` +
    `• Город: ${state.city}\n` +
    `• Контакт: ${state.contactTelegram || state.contactPhone}\n` +
    `• Имя: ${state.sellerName}\n\n` +
    "Всё верно? Нажмите кнопку:";
  await ctx.reply(msg, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Отправить на модерацию", callback_data: "confirm_submit" }],
        [{ text: "❌ Отмена", callback_data: "cancel_submit" }],
      ],
    },
  });
}

export async function handleSubmitPhoto(ctx: Context, fileId: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const state = getState(chatId);
  if (!state || state.step !== 1) return;

  const photos = state.photoFileIds ?? [];
  if (photos.length >= MAX_PHOTOS) {
    await ctx.reply("Можно добавить не более 3 фото.");
    return;
  }

  photos.push(fileId);
  setState(chatId, { ...state, photoFileIds: photos });

  await ctx.reply(
    `Загружено фото: ${photos.length} из ${MAX_PHOTOS}.`,
    { reply_markup: getPhotoKeyboard(photos.length) }
  );
}

export async function handleSubmitPhotoDone(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const state = getState(chatId);
  if (!state || state.step !== 1) return;

  const photos = state.photoFileIds ?? [];
  if (photos.length === 0) {
    await ctx.answerCbQuery("Добавьте хотя бы одно фото", { show_alert: true });
    return;
  }

  setState(chatId, { ...state, step: 2 });
  await ctx.answerCbQuery();
  await ctx.reply(
    `Шаг 3/9: Введите *описание* товара (до ${MAX_DESCRIPTION_LENGTH} символов):`,
    { parse_mode: "Markdown", ...submitFlowKeyboard }
  );
}

export async function handleSubmitPhotoAdd(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const state = getState(chatId);
  if (!state || state.step !== 1) return;

  const photos = state.photoFileIds ?? [];
  if (photos.length >= MAX_PHOTOS) {
    await ctx.answerCbQuery("Максимум 3 фото", { show_alert: true });
    return;
  }

  await ctx.answerCbQuery();
  await ctx.reply(`Отправьте ещё одно фото (уже ${photos.length} из ${MAX_PHOTOS}):`, submitFlowKeyboard);
}

export async function handleSubmitPhotoCancel(ctx: Context) {
  await cancelSubmitFlow(ctx, true);
}

export async function handleCategorySelect(ctx: Context, categoryId: string) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const state = getState(chatId);
  if (!state || state.step !== 4) return;
  await ctx.answerCbQuery();
  setState(chatId, { ...state, step: 5, categoryId });
  const list = CITIES.join(", ");
  await ctx.reply("Шаг 6/9: Выберите город кнопкой ниже:", {
    parse_mode: "Markdown",
    ...getCityKeyboard(),
  });
}

export async function handleConfirmSubmit(ctx: Context) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const state = getState(chatId);
  if (!state || state.step !== 8) return;

  const user = await getOrCreateUser(ctx.from!);
  if (!user) {
    await ctx.reply("Ошибка при создании профиля. Попробуйте /start");
    return;
  }

  const activeCount = await prisma.listing.count({
    where: {
      userId: user.id,
      status: { in: ACTIVE_STATUSES },
    },
  });
  if (activeCount >= MAX_ACTIVE_LISTINGS) {
    await ctx.answerCbQuery();
    await ctx.reply(
      "У вас уже есть 5 активных объявлений. Удалите одно из существующих, чтобы добавить новое."
    );
    clearState(chatId);
    return;
  }

  const photos = state.photoFileIds ?? [];
  if (photos.length === 0) {
    await ctx.answerCbQuery("Добавьте хотя бы одно фото", { show_alert: true });
    return;
  }

  try {
    const listing = await prisma.listing.create({
      data: {
        title: state.title!,
        description: state.description!,
        price: parseFloat(state.price!),
        currency: "KGS",
        categoryId: state.categoryId!,
        city: state.city!,
        sellerName: state.sellerName!,
        contactTelegram: state.contactTelegram ?? null,
        contactPhone: state.contactPhone ?? null,
        status: "PENDING",
        userId: user.id,
        images: {
          create: photos.map((fileId, idx) => ({ fileId, order: idx })),
        },
      },
      include: { images: true },
    });

    clearState(chatId);
    await ctx.answerCbQuery();
    await ctx.reply(
      "✅ Объявление отправлено на модерацию!\n\n" +
        "Ожидайте проверки. После одобрения оно появится в канале и каталоге.\n\n" +
        "Используйте /mylistings чтобы посмотреть статус своих объявлений."
    );

    await sendToAdminForModeration(ctx.telegram, listing.id);
  } catch (err) {
    console.error("Create listing error:", err);
    await ctx.answerCbQuery();
    await ctx.reply("Произошла ошибка. Попробуйте позже или /cancel");
  }
}
