# Архитектура проекта KG Listings (Telegram объявления Кыргызстан)

## Поток данных

```
Telegram User → Bot (пошаговый сбор данных)
        ↓
    Database (listings, status: pending)
        ↓
    Admin получает уведомление в Telegram
        ↓
    Admin: Одобрить / Отклонить
        ↓
    Если одобрено:
        - status → approved
        - Публикация в Telegram-канал
        - Появление в Mini App
    Если отклонено:
        - status → rejected
        - Уведомление пользователю
```

## Структура папок (монорепозиторий)

```
kg-listings/
├── packages/
│   ├── backend/          # API сервер (Express + Prisma)
│   ├── bot/              # Telegram бот
│   └── mini-app/         # Telegram Mini App (Next.js)
├── prisma/               # Схема и миграции (общая для backend и bot)
├── shared/               # Общие типы и константы
├── uploads/              # Локальное хранение фото (MVP)
├── .env.example
├── ARCHITECTURE.md
├── README.md
└── package.json          # Root package.json для монорепо
```

### За что отвечает каждая папка

| Папка | Назначение |
|-------|------------|
| `packages/backend` | REST API для Mini App, CRUD listings, категории, города. Запуск: `npm run dev` |
| `packages/bot` | Telegram-бот: сбор объявлений, модерация, публикация в канал. Запуск: `npm run dev` |
| `packages/mini-app` | Next.js приложение — каталог, карточки, поиск. Host внутри Telegram |
| `prisma` | Схема БД, миграции, seed. Используется backend и bot |
| `shared` | Общие типы TypeScript, константы (категории, города) |
| `uploads` | Папка для сохранения загруженных фото (MVP) |

## Компоненты и их взаимодействие

1. **Bot** ↔ **Database** — Prisma напрямую в боте
2. **Bot** ↔ **Backend** — опционально через API, но для MVP бот сам работает с БД
3. **Mini App** ↔ **Backend** — только backend API
4. **Bot** → **Telegram Channel** — публикация после одобрения
5. **Bot** → **Admin** — inline-кнопки модерации

## Хранение фото

- **MVP**: Сохраняем `telegram_file_id` в БД — Telegram хранит файл, бот получает URL через `getFile`
- Альтернатива: скачивать файл и сохранять в `uploads/` — работает и без интернета к Telegram
- Для Mini App: backend отдаёт URL (либо `https://api.telegram.org/file/bot<TOKEN>/<file_path>`)

## Deep Links

- **Mini App URL**: `https://your-domain.com` (в BotFather: Bot Settings → Menu Button)
- **Кнопка в канале**: `https://t.me/YourBotName/app` или Web App URL
- **Прямая ссылка на товар**: `https://your-domain.com/listing/[id]`
