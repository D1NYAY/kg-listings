"use client";

import { useEffect, useState } from "react";
import type { TelegramWebApp } from "@/types/telegram";

export function useTelegram(): TelegramWebApp | null {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const app = window.Telegram.WebApp;
      app.ready();
      app.expand();
      setTg(app);
    }
  }, []);

  return tg;
}

export function useTelegramUser() {
  const tg = useTelegram();
  return tg?.initDataUnsafe?.user ?? null;
}
