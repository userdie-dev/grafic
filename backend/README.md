# Backend - График смен

NestJS API для приложения управления сменами.

## Требования

- Node.js 24.x
- npm или pnpm

## Деплой на Vercel

Ядро NestJS (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
и `@nestjs/testing` должны оставаться на совместимой ветке 11.x.
`@nestjs/throttler` 6.7.1 использует CommonJS `require()` для загрузки
`@nestjs/common`. С ESM-версией NestJS 12 это вызывает `ERR_REQUIRE_ESM`
в среде Vercel. Формат ESM самого приложения менять не требуется.

После изменения зависимостей коммитьте `package.json` вместе с
`package-lock.json`. В Vercel используйте Node.js 24.x и установку через
`npm ci`. При повторном деплое отключите использование Build Cache,
чтобы исключить старые зависимости.

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

Локально используется SQLite с TypeORM. База создается автоматически при первом запуске в файле `grafic.sqlite`.

Если задан `DATABASE_URL`, приложение подключается к PostgreSQL (Neon), а TypeORM создает/обновляет таблицы при старте.

Для прямых SQL-запросов через [Neon serverless driver](https://neon.tech/docs/serverless/serverless-driver) есть `DatabaseService`:

```ts
import { DatabaseService } from './database/database.service';

const rows = await this.databaseService.getData();
```

## API Endpoints

`GET /` — стартовая HTML-страница бэкенда со списком маршрутов и инструкцией
по авторизации. Доступна без токена устройства.

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
# SQLite (локально)
DB_PATH=grafic.sqlite
# Neon PostgreSQL (если задан, используется вместо SQLite)
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
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

- Root Directory: `backend`.
- Node.js Version: `24.x` (также задана в `package.json`).
- Задайте `DATABASE_URL` для нужного окружения Vercel.
- После изменения настроек выполните Redeploy.

Бэкенд использует ESM (`type: module`, TypeScript `NodeNext`), как и NestJS 12.
Node.js 24 также нужен для CommonJS-зависимостей, загружающих ESM через `require()`.

Для production нужна PostgreSQL база данных (Supabase, Neon, Railway и т.п.).

**Настройка:**

1. Создайте базу данных и получите строку подключения
2. Задайте переменную окружения:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```
3. Соберите и запустите приложение:
   ```
   npm ci
   npm run build
   npm start
   ```

**Локальная разработка использует SQLite**, production использует PostgreSQL.
