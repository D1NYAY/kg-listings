# Сводка изменений: админ, отмена, город кнопками

## План изменений по файлам

### Новые файлы
- `bot/src/utils/admin.ts` — helper `isAdmin(telegramId)`, `getAdminIds()`
- `backend/src/utils/admin.ts` — `isAdmin()` для backend
- `bot/src/handlers/admindelete.ts` — сценарий /admindelete для админа

### Изменённые файлы
- `bot/src/index.ts` — /admindelete, callbacks admindelete, проверка admindelete state в text
- `bot/src/handlers/start.ts` — MENU_BUTTONS.cancel, submitFlowKeyboard
- `bot/src/handlers/submit.ts` — cancelSubmitFlow, кнопка «Отменить», город кнопками, submitFlowKeyboard
- `bot/src/handlers/delete.ts` — без изменений (уже только свои)
- `bot/src/utils/moderation.ts` — использование getAdminIds из admin.ts
- `bot/src/state.ts` — adminDeleteAwaitingId для ожидания ID
- `backend/src/routes/listings.ts` — DELETE /api/listings/:id с проверкой прав
- `.env.example` — ADMIN_TELEGRAM_IDS

### Prisma schema
- Без изменений

---

## Helper-функции

| Функция | Файл | Описание |
|---------|------|----------|
| `isAdmin(telegramId)` | bot/utils/admin.ts, backend/utils/admin.ts | Проверяет, является ли пользователь админом (из .env) |
| `getAdminIds()` | bot/utils/admin.ts | Возвращает массив telegram ID админов |
| `cancelSubmitFlow(ctx, fromCallback)` | bot/handlers/submit.ts | Универсальная отмена подачи объявления |
| `getCityKeyboard()` | bot/handlers/submit.ts | Reply-клавиатура с городами и «Отменить» |
| `submitFlowKeyboard` | bot/handlers/start.ts | Reply-клавиатура с кнопкой «Отменить» |

---

## Команды после изменений

```bash
# Никаких миграций не требуется
npm run dev
```

Проверьте `.env`:
- `TELEGRAM_ADMIN_IDS` или `ADMIN_TELEGRAM_IDS` — ID админов через запятую

---

## Checklist проверки

- [ ] Обычный пользователь удаляет только свои объявления (/delete)
- [ ] Админ удаляет любые объявления (/admindelete)
- [ ] /admindelete возвращает «Эта команда доступна только администратору» для не-админа
- [ ] /cancel работает на любом шаге подачи объявления
- [ ] Кнопка «Отменить» работает на шагах: title, description, price, city, contact, sellerName
- [ ] Inline «Отмена» работает на шагах: photo, category, confirm
- [ ] Город выбирается кнопками (Бишкек, Ош, Каракол, …)
- [ ] При ручном вводе города вместо кнопки: «Пожалуйста, выберите город кнопкой ниже.»
- [ ] deleted не показывается в Mini App и API
- [ ] Backend DELETE /api/listings/:id проверяет владельца или админа
