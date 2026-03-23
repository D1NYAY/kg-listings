import { Context } from "telegraf";
import { prisma } from "../prisma";
import { getOrCreateUser } from "../utils/user";

const STATUS_EMOJI: Record<string, string> = {
  PENDING: "⏳",
  APPROVED: "✅",
  REJECTED: "❌",
};

export async function handleMyListings(ctx: Context) {
  const user = await getOrCreateUser(ctx.from!);
  const listings = await prisma.listing.findMany({
    where: { userId: user.id, status: { not: "DELETED" } },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (listings.length === 0) {
    await ctx.reply(
      "У вас пока нет объявлений.\n\nПодать объявление: /submit"
    );
    return;
  }

  const lines = listings.map(
    (l) =>
      `${STATUS_EMOJI[l.status] || "•"} ${l.title} — ${l.price} KGS (${l.status})`
  );
  await ctx.reply(
    "📋 *Ваши объявления:*\n\n" + lines.join("\n") + "\n\nПодать новое: /submit",
    { parse_mode: "Markdown" }
  );
}
