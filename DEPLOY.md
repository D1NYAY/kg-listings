# Инструкция по деплою KG Listings

## 1. Подготовка

- Зарегистрируй бота через [@BotFather](https://t.me/BotFather)
- Создай Telegram-канал
- Заведи PostgreSQL (локально или облако)
- Подготовь хостинг для backend, bot, mini-app

## 2. Telegram Bot

1. **BotFather** → `/newbot` → имя и username
2. Токен → `TELEGRAM_BOT_TOKEN`
3. Узнай свой ID: [@userinfobot](https://t.me/userinfobot) → `TELEGRAM_ADMIN_IDS`

## 3. Канал

1. Создай канал
2. Добавь бота как админа (может публиковать)
3. Username канала → `TELEGRAM_CHANNEL_ID` (например `@kg_listings`)

## 4. Mini App в боте

1. **BotFather** → твой бот → **Bot Settings** → **Menu Button**
2. **Configure menu button** → **Edit menu button URL**
3. Введи URL Mini App (должен быть HTTPS):
   - Dev: `https://xxx.ngrok.io`
   - Prod: `https://kg-listings.vercel.app`

## 5. Деплой Backend (пример: VPS)

```bash
git clone <repo>
cd kg-listings
npm install
cp .env.example .env
# отредактируй .env
npx prisma migrate deploy
npx prisma db seed
cd backend && npm run build
node dist/index.js  # или pm2 start
```

## 6. Деплой Bot

На том же или другом сервере:

```bash
cd kg-listings/bot
npm run build
TELEGRAM_BOT_TOKEN=xxx DATABASE_URL=xxx node dist/index.js
```

Или через PM2:

```bash
pm2 start bot/dist/index.js --name kg-bot
```

## 7. Деплой Mini App (Vercel)

1. Импортируй репозиторий в Vercel
2. Root Directory: `mini-app`
3. Environment Variables:
   - `NEXT_PUBLIC_API_URL` = URL твоего backend
   - `NEXT_PUBLIC_BOT_USERNAME` = username бота без @
4. Deploy

## 8. CORS

Backend должен разрешать запросы с домена Mini App. В `backend/src/index.ts` уже стоит `cors({ origin: "*" })`. Для прода можно ограничить:

```js
cors({ origin: ["https://kg-listings.vercel.app"] })
```

## 9. Проверка

- Открой бота в Telegram
- Нажми Menu (или кнопку) → должен открыться Mini App
- Подай тестовое объявление
- Проверь, что админ получил модерацию
- Одобри → должно появиться в канале и в Mini App
