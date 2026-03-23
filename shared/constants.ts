/**
 * Общие константы для backend, bot и mini-app
 */

export const CITIES = [
  "Бишкек",
  "Ош",
  "Каракол",
  "Джалал-Абад",
  "Нарын",
  "Талас",
  "Баткен",
] as const;

export type City = (typeof CITIES)[number];

export const CURRENCY = "KGS" as const;

export const LISTING_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const DEFAULT_CITY = "Бишкек" as const;
