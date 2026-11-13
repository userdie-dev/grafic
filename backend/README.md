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

Приложение развернуто на Vercel: https://grafic-rose.vercel.app/

Для деплоя используется встроенная поддержка Vercel для NestJS.
