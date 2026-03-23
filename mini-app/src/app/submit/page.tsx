"use client";

import { useTelegram } from "@/hooks/useTelegram";
import { BottomNav } from "@/components/BottomNav";

export default function SubmitPage() {
  const tg = useTelegram();

  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "kg_listings_bot";
  const botUrl = `https://t.me/${botUsername}`;

  const openBot = () => {
    if (tg) {
      tg.openTelegramLink(botUrl);
    } else {
      window.open(botUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen pb-20 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl mb-4">📝</p>
        <h2 className="text-xl font-bold mb-2">Подать объявление</h2>
        <p className="text-tg-hint text-sm mb-6">
          Объявления подаются через нашего бота. Нажмите кнопку ниже, чтобы перейти в бота и
          оформить объявление.
        </p>
        <button
          onClick={openBot}
          className="w-full bg-tg-button text-white font-semibold py-3 rounded-xl active:opacity-90"
        >
          Открыть бота
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
