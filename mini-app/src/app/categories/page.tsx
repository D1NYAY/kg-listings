"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCategories, type Category } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";

const categoryEmoji: Record<string, string> = {
  flowers: "🌸",
  gifts: "🎁",
  clothing: "👕",
  shoes: "👟",
  electronics: "📱",
  accessories: "👜",
  other: "📦",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <header className="px-4 py-4">
        <h1 className="text-xl font-bold">Категории</h1>
      </header>
      <main className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?category=${c.id}`}
              className="bg-tg-bg-secondary rounded-2xl p-4 flex items-center gap-3 active:opacity-90"
            >
              <span className="text-3xl">{categoryEmoji[c.slug] || "📦"}</span>
              <span className="font-medium">{c.name}</span>
            </Link>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
