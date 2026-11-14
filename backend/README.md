# Backend - График смен

NestJS API для приложения управления сменами.

## Требования

- Node.js 18+
- npm или pnpm

## Установка

```bash
cd backend
npm install
```

## Запуск

### Development
```bash
npm run start:dev
```

Сервер запустится на `http://localhost:3000`

### Production
```bash
# Сборка
npm run build

# Запуск
npm start
```

## Тестирование

```bash
# Запуск тестов
npm test

# Тесты с покрытием
npm run test:cov
```

## База данных

Используется SQLite с TypeORM. База создается автоматически при первом запуске в файле `grafic.sqlite`.

## API Endpoints

### Устройства
- `POST /devices` - регистрация нового устройства
- `POST /me/share-code/regenerate` - обновление кода для шаринга

### Смены
- `GET /me/shifts?from=YYYY-MM-DD&to=YYYY-MM-DD` - получить свои смены
- `PUT /me/shifts` - сохранить смены (массив)
- `DELETE /me/shifts/:id` - удалить смену

### Подписки (друзья)
- `GET /subscriptions` - список подписок
- `POST /subscriptions` - добавить друга по коду
- `DELETE /subscriptions/:id` - удалить подписку
- `GET /friends/:ownerId/shifts?from=&to=` - смены друга

### События (SSE)
- `GET /events?token=...` - Server-Sent Events для live-обновлений

## Переменные окружения

Создайте `.env` файл:

```env
PORT=3000
DATABASE_PATH=./grafic.sqlite
```

## Структура

```
backend/
├── src/
│   ├── auth/           # JWT токены для устройств
│   ├── db/             # TypeORM entities
│   ├── devices/        # Регистрация устройств
│   ├── events/         # SSE для live-обновлений
│   ├── friends/        # Просмотр смен друзей
│   ├── shifts/         # CRUD смен
│   ├── subscriptions/  # Управление подписками
│   └── main.ts         # Entrypoint
├── test/               # Интеграционные тесты
└── package.json
```

## Production Deployment

### Vercel

Приложение деплоится на Vercel как обычный NestJS-проект (zero-config): Vercel сам
находит `src/main.ts` и собирает всё приложение в одну Vercel Function.

**Требования:**
- PostgreSQL база данных (например, Vercel Postgres, Supabase, Neon)

**Настройка:**

1. В Vercel: **Settings → General → Root Directory** = `backend`
2. **Settings → Build & Development**: Framework Preset = `NestJS` (в репозитории уже
   задан `backend/vercel.json` с `"framework": "nestjs"`), Build Command / Output Directory
   оставьте пустыми (по умолчанию)
3. В **Settings → Environment Variables** добавьте:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```
4. Deploy автоматически произойдет при push в main

Файл `backend/vercel.json` не должен содержать `buildCommand`, `outputDirectory`,
`functions` с `runtime` или legacy `routes` — иначе Vercel перестаёт использовать
встроенную сборку NestJS.

**Локальная разработка использует SQLite**, production на Vercel использует PostgreSQL.

### Альтернатива: Railway, Render, Fly.io

Для этих платформ настройте `DATABASE_URL` и деплойте как обычное Node.js приложение.
