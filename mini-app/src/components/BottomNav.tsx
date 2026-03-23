"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Главная", icon: "🏠" },
  { href: "/categories", label: "Категории", icon: "📂" },
  { href: "/submit", label: "Подать", icon: "➕" },
  { href: "/favorites", label: "Избранное", icon: "❤️" },
  { href: "/profile", label: "Профиль", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-tg-bg-secondary border-t border-tg-bg-tertiary safe-area-bottom z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 min-w-[56px] rounded-lg transition-colors ${
                isActive ? "text-tg-button" : "text-tg-hint"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
