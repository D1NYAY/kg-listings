"use client";

import { BottomNav } from "@/components/BottomNav";

export default function FavoritesPage() {
  return (
    <div className="min-h-screen pb-20 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">❤️</p>
        <h2 className="text-xl font-bold mb-2">Избранное</h2>
        <p className="text-tg-hint text-sm">В MVP избранное пока недоступно.</p>
      </div>
      <BottomNav />
    </div>
  );
}
