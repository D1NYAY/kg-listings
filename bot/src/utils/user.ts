import { User as TgUser } from "telegraf/types";
import { User as PrismaUser } from "@prisma/client";
import { prisma } from "../prisma";

export async function getOrCreateUser(from: TgUser): Promise<PrismaUser> {
  const telegramId = BigInt(from.id);

  const existing = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (existing) {
    return existing;
  }

  try {
    return await prisma.user.create({
      data: {
        telegramId,
        username: from.username ?? null,
        firstName: from.first_name ?? null,
        lastName: from.last_name ?? null,
      },
    });
  } catch (error) {
    const retry = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (retry) {
      return retry;
    }

    throw error;
  }
}