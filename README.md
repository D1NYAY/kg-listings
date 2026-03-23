# KG Listings — Telegram объявления для Кыргызстана

MVP сервиса объявлений о продаже товаров: Telegram-бот + backend + Mini App.

## Структура проекта

```
kg-listings/
├── backend/       # Express API (порт 3001)
├── bot/           # Telegram бот (Telegraf)
├── mini-app/      # Next.js Mini App (порт 3000)
├── prisma/        # Схема БД, миграции, seed
├── shared/        # Общие константы
├── uploads/       # Локальные фото (MVP)
└── .env.example
```

## Требования

- Node.js 18+
- PostgreSQL 14+
- Telegram аккаунт

---

## Быстрый старт (локально)

### 1. Установка зависимостей

```bash
cd kg-listings
npm install
```

### 2. Настройка окружения

```bash
cp .env.example .env
```

Заполни `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kg_listings"
TELEGRAM_BOT_TOKEN="твой_токен_от_BotFather"
TELEGRAM_ADMIN_IDS="твой_telegram_id"
TELEGRAM_CHANNEL_ID="@твой_канал"
API_PORT=3001
MINI_APP_URL="http://localhost:3000"
```

### 3. База данных

```bash
npm run db:migrate
npm run db:seed
```

### 4. Запуск

```bash
npm run dev
```

Будут запущены:
- Backend: http://localhost:3001
- Bot: в фоне
- Mini App: http://localhost:3000

---

## Настройка Telegram

### Создание бота

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot` — придумай имя и username
3. Скопируй токен в `TELEGRAM_BOT_TOKEN`

### Узнать свой Telegram ID

1. Напиши боту [@userinfobot](https://t.me/userinfobot)
2. Скопируй ID в `TELEGRAM_ADMIN_IDS`

### Подключение Mini App

1. [@BotFather](https://t.me/BotFather) → выбери бота → **Bot Settings** → **Menu Button**
2. **Configure menu button** → введи URL Mini App:
   - Локально: `https://твой-ngrok-url.ngrok.io` (см. ниже)
   - Прод: `https://твой-домен.com`

### Публикация в канал

1. Создай канал
2. Добавь бота как администратора (право «Публиковать сообщения»)
3. Узнай chat_id канала (отрицательное число, например `-1001234567890`)
4. В `.env`:
   - `TELEGRAM_CHANNEL_ID=@username_канала` или
   - `TELEGRAM_CHANNEL_CHAT_ID=-1001234567890`

---

## Тестирование локально с Mini App

Telegram открывает Mini App только по HTTPS. Для локальной разработки:

1. Установи [ngrok](https://ngrok.com/)
2. Запусти: `ngrok http 3000`
3. Скопируй HTTPS URL (например `https://abc123.ngrok.io`)
4. В BotFather укажи этот URL как Menu Button
5. `MINI_APP_URL` и `NEXT_PUBLIC_API_URL` — тот же ngrok URL или отдельный туннель для backend (порт 3001)

Если Mini App и API на разных портах, для API нужен отдельный ngrok: `ngrok http 3001`.

---

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `TELEGRAM_BOT_TOKEN` | Токен от BotFather |
| `TELEGRAM_ADMIN_IDS` | Telegram ID админов через запятую |
| `TELEGRAM_CHANNEL_ID` | @username канала для публикации |
| `TELEGRAM_CHANNEL_CHAT_ID` | Альтернатива: числовой chat_id канала |
| `API_PORT` | Порт backend (по умолчанию 3001) |
| `MINI_APP_URL` | URL Mini App (для кнопок в канале) |
| `NEXT_PUBLIC_API_URL` | URL API для Mini App (в mini-app/.env.local) |
| `NEXT_PUBLIC_BOT_USERNAME` | @username бота (для кнопки «Подать») |

---

## Деплой

### Backend

- VPS (DigitalOcean, Hetzner и т.д.) или Railway, Render
- Установи Node.js, PostgreSQL
- `npm run build` в backend
- Запуск: `node dist/index.js` или через PM2

### Bot

- Тот же сервер или отдельный
- Запуск: `node dist/index.js` (папка bot)

### Mini App

- Vercel, Netlify или любой хостинг с Node.js
- `npm run build` в mini-app
- `npm run start` или статический экспорт
- Укажи `NEXT_PUBLIC_API_URL` на продовый API

### База данных

- Используй облачный PostgreSQL (Supabase, Neon, Railway)
- Обнови `DATABASE_URL`
- Выполни миграции: `npx prisma migrate deploy`

---

## Шаблоны сообщений

### Пост в канале

```
{название}

💰 {цена} KGS
📂 {категория} | {город}
👤 {имя продавца}

{описание, первые 200 символов}

[Кнопка: Смотреть в каталоге]
```

### Сообщение админу на модерацию

```
🆕 Новое объявление на модерацию

📌 {название}
💰 {цена} KGS
📂 {категория} | {город}
👤 {имя продавца}
📝 {описание, 150 символов}

[Кнопки: Одобрить | Отклонить]
```

---

## Чеклист проверки

- [ ] Бот отвечает на /start
- [ ] Можно подать объявление через /submit
- [ ] Админ получает карточку с кнопками
- [ ] «Одобрить» публикует в канал
- [ ] «Отклонить» меняет статус
- [ ] Mini App показывает одобренные объявления
- [ ] Поиск и фильтры работают
- [ ] Кнопка «Написать» открывает Telegram

---

## Упрощения для MVP

- Состояние бота — в памяти (при перезапуске сбрасывается)
- Избранное — заглушка
- Фото — только через Telegram file_id
- Модерация — только через бота

## Что заменить на проде

- Хранить фото локально или в S3
- Redis для состояния бота
- Rate limiting на API
- Валидация и санитизация ввода
- Логирование (Winston, Pino)
