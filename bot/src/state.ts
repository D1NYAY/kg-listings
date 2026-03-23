/**
 * Хранилище состояния пользователей при подаче объявления.
 * MVP: in-memory. Для продакшена — Redis или таблица Draft в БД.
 */
export interface DraftListing {
  step: number;
  title?: string;
  photoFileIds?: string[]; // До 3 фото
  description?: string;
  price?: string;
  categoryId?: string;
  city?: string;
  contactTelegram?: string;
  contactPhone?: string;
  sellerName?: string;
}

const userState = new Map<number, DraftListing>();

export function getState(chatId: number): DraftListing | undefined {
  return userState.get(chatId);
}

export function setState(chatId: number, draft: DraftListing): void {
  userState.set(chatId, draft);
}

export function clearState(chatId: number): void {
  userState.delete(chatId);
  adminDeleteAwaitingId.delete(chatId);
}

/** Состояние ожидания ID для /admindelete */
const adminDeleteAwaitingId = new Set<number>();

export function setAdminDeleteAwaitingId(chatId: number, value: boolean): void {
  if (value) adminDeleteAwaitingId.add(chatId);
  else adminDeleteAwaitingId.delete(chatId);
}

export function isAdminDeleteAwaitingId(chatId: number): boolean {
  return adminDeleteAwaitingId.has(chatId);
}
