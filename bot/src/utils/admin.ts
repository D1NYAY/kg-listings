/**
 * Проверка, является ли пользователь администратором.
 * Админы задаются через .env: ADMIN_TELEGRAM_IDS или TELEGRAM_ADMIN_IDS
 * Формат: "123456789,987654321"
 */
export function isAdmin(telegramId: string | number): boolean {
  const idsStr =
    process.env.ADMIN_TELEGRAM_IDS || process.env.TELEGRAM_ADMIN_IDS || "";
  const ids = idsStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10));
  const id = typeof telegramId === "string" ? parseInt(telegramId, 10) : telegramId;
  return !isNaN(id) && ids.includes(id);
}

export function getAdminIds(): number[] {
  const idsStr =
    process.env.ADMIN_TELEGRAM_IDS || process.env.TELEGRAM_ADMIN_IDS || "";
  return idsStr
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}
