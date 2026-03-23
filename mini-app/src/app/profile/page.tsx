"use client";

import { useTelegramUser } from "@/hooks/useTelegram";
import { BottomNav } from "@/components/BottomNav";

export default function ProfilePage() {
  const user = useTelegramUser();

  return (
    <div className="min-h-screen pb-20">
      <header className="px-4 py-4">
        <h1 className="text-xl font-bold">Профиль</h1>
      </header>
      <main className="px-4">
        {user ? (
          <div className="bg-tg-bg-secondary rounded-2xl p-4">
            <p className="text-tg-text font-medium">
              {user.first_name} {user.last_name || ""}
            </p>
            {user.username && (
              <p className="text-tg-hint text-sm mt-1">@{user.username}</p>
            )}
          </div>
        ) : (
          <p className="text-tg-hint">
            Откройте приложение через Telegram, чтобы увидеть профиль.
          </p>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
