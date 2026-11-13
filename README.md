# График смен

Веб-приложение для управления рабочими сменами и координации с друзьями/коллегами.

## Возможности

- 📅 Календарь смен с визуализацией
- 👥 Группы людей для совместного планирования
- 🔄 Пресеты смен (повторяющиеся графики)
- 🌙 Поддержка дневных и ночных смен
- 📊 Диаграмма занятости на день
- 🔗 Шаринг графиков с друзьями
- 🌓 Темная/светлая тема
- 📱 Адаптивный дизайн

## Структура проекта

```
grafic/
├── backend/     # NestJS API (TypeScript)
└── frontend/    # Vue 3 SPA (TypeScript)
```

## Быстрый старт

### Backend

```bash
cd backend
npm install
npm run start:dev
```

API будет доступен на `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:5174`

## Разработка

### Требования

- Node.js 18+
- npm или pnpm

### Backend

- NestJS + TypeORM + SQLite
- JWT аутентификация
- SSE для live-обновлений
- Подробнее: [backend/README.md](backend/README.md)

### Frontend

- Vue 3 + TypeScript + Vite
- TanStack Query для кэширования
- Pinia для state management
- Tailwind CSS для стилей
- Подробнее: [frontend/README.md](frontend/README.md)

## Production

Развернуто на Vercel: https://grafic-rose.vercel.app/

### Deployment

Backend и frontend автоматически деплоятся при push в main ветку.

## Архитектура

### Группы

Группы позволяют объединять людей. Участники группы:
- Не отображаются отдельно в календаре
- Их смены агрегируются под именем группы
- Группа отображается с иконкой 👥

### Пресеты

Шаблоны смен для быстрого добавления:
- Один раз - одна смена
- Еженедельно - повторяется каждую неделю
- Цикл - N рабочих, M выходных
- Дни недели - выбранные дни недели

### Навигация

5 основных разделов:
1. Календарь - основной вид
2. Группы - управление группами
3. Пресеты - шаблоны смен
4. Поделиться - код для друзей
5. Настройки - настройки приложения

## Тестирование

```bash
# Backend тесты
cd backend
npm test
npm run test:cov

# Frontend тесты
cd frontend
npm test
npm run type-check
```

## Лицензия

ISC
