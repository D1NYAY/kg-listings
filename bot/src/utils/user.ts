import { User as TgUser } from "telegraf/types";
import { prisma } from "../prisma";

export async function getOrCreateUser(from: TgUser) {
  const telegramId = BigInt(from.id);
  let user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        username: from.username ?? null,
        firstName: from.first_name ?? null,
        lastName: from.last_name ?? null,
      },
    });
  }
  return user;
}
