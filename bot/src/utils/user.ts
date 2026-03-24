import { User as TgUser } from "telegraf/types";
import { prisma } from "../prisma";

export async function getOrCreateUser(from: TgUser) {
  const telegramId = BigInt(from.id);

  // сначала ищем пользователя
  const existing = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (existing) {
    return existing;
  }

  // если нет — создаём
  try {
    return await prisma.user.create({
      data: {
        telegramId,
        username: from.username ?? null,
        firstName: from.first_name ?? null,
        lastName: from.last_name ?? null,
      },
    });
  } catch (e) {
    // если вдруг параллельно уже создался (фикс ошибки P2002)
    return await prisma.user.findUnique({
      where: { telegramId },
    });
  }
}