# Сводка изменений — KG Listings

## Изменённые и новые файлы

### Prisma
- **prisma/schema.prisma** — добавлена модель `ListingImage`, статус `DELETED`
- **prisma/seed.ts** — миграция старых `photoFileId` в `ListingImage`
- **prisma/migrations/20260323163416_add_listing_image_and_deleted_status/** — миграция

### Bot
- **bot/src/index.ts** — команда `/delete`, callback для фото, reply keyboard, `setMyCommands`
- **bot/src/handlers/start.ts** — reply keyboard с кнопками меню
- **bot/src/handlers/submit.ts** — лимиты (5 объявлений, 3 фото, 50/300 символов), массив фото
- **bot/src/handlers/mylistings.ts** — исключение deleted
- **bot/src/handlers/delete.ts** — новый хэндлер удаления
- **bot/src/state.ts** — `photoFileIds: string[]` вместо `photoFileId`
- **bot/src/utils/moderation.ts** — использование `ListingImage` для модерации

### Backend
- **backend/src/routes/listings.ts** — `include: images`
- **backend/src/routes/image.ts** — маршрут `/:listingId/:index` для нескольких фото

### Mini App
- **mini-app/src/lib/api.ts** — `ListingImage`, `getListingImageUrl(index)`, `getListingImageUrls()`
- **mini-app/src/app/listing/[id]/page.tsx** — галерея фото с переключателем

---

## Логика работы

### 1. Лимит 5 активных объявлений
- При `/submit` и при подтверждении проверяется количество объявлений со статусами `PENDING` и `APPROVED`.
- Если ≥ 5 — отправляется: «У вас уже есть 5 активных объявлений. Удалите одно из существующих, чтобы добавить новое.»

### 2. До 3 фото
- Шаг «фото» принимает 1–3 фото, после каждого — кнопки: «Добавить ещё», «Готово», «Отмена».
- После 3 фото — только «Готово» и «Отмена».
- При попытке загрузить 4‑е фото — «Можно добавить не более 3 фото.»

### 3. Валидация
- Название: до 50 символов.
- Описание: до 300 символов.

### 4. Удаление
- `/delete` или кнопка «Удалить объявление».
- Показ списка объявлений пользователя.
- Выбор объявления → подтверждение «Да, удалить» / «Отмена».
- Статус меняется на `DELETED`, записи в БД остаются.

### 5. Команды и меню
- Регистрация через `setMyCommands`: /start, /submit, /mylistings, /delete, /help, /cancel.
- Reply keyboard на `/start`: «Подать объявление», «Мои объявления», «Удалить объявление», «Помощь».

### 6. Фото в API
- Первое фото: `GET /api/image/:listingId`.
- Фото по индексу: `GET /api/image/:listingId/:index` (0, 1, 2).

---

## Команды для запуска

```bash
# Миграция (уже применена)
npx prisma migrate dev

# Генерация Prisma Client
npx prisma generate

# Seed (миграция старых фото в ListingImage)
npx prisma db seed

# Запуск
npm run dev
```

---

## Чеклист тестирования

- [ ] Лимит 5 объявлений — при 5 активных `/submit` отклоняет
- [ ] Лимит 3 фото — 4‑е фото отклоняется
- [ ] Название до 50 символов — длинное отклоняется
- [ ] Описание до 300 символов — длинное отклоняется
- [ ] Удаление — объявление переходит в статус DELETED
- [ ] Удалённые объявления не видны в Mini App
- [ ] PENDING объявления не видны в Mini App
- [ ] APPROVED объявления видны в Mini App
- [ ] Несколько фото — отображаются в карточке и на странице товара
- [ ] Кнопки меню и команды — работают
- [ ] Модерация — админу отправляется первое фото
