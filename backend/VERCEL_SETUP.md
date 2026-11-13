# Настройка Vercel Postgres для бэкенда

## Шаги

### 1. Создайте Vercel Postgres базу данных

1. Откройте проект на https://vercel.com
2. Перейдите в Storage → Create Database
3. Выберите Postgres
4. Создайте базу данных

### 2. Подключите базу к проекту

1. В разделе Storage выберите созданную базу
2. Перейдите на вкладку Settings → Environment Variables
3. Нажмите "Copy Snippet" для получения всех переменных
4. Или вручную скопируйте `POSTGRES_URL` как `DATABASE_URL`

### 3. Добавьте переменную окружения

В настройках проекта (Settings → Environment Variables):

```
DATABASE_URL=postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb
```

### 4. Redeploy проект

```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

Или через Vercel dashboard: Deployments → ••• → Redeploy

## Альтернативы Vercel Postgres

### Supabase (бесплатный tier)
1. Создайте проект на https://supabase.com
2. Database → Connection String → URI
3. Добавьте в Vercel как `DATABASE_URL`

### Neon (бесплатный tier)
1. Создайте проект на https://neon.tech
2. Скопируйте Connection String
3. Добавьте в Vercel как `DATABASE_URL`

### Railway (платный)
1. Создайте PostgreSQL на https://railway.app
2. Скопируйте DATABASE_URL
3. Добавьте в Vercel

## Проверка подключения

После деплоя проверьте:
```bash
curl https://grafic-rose.vercel.app/
```

Должен вернуться ответ без 500 ошибки.

## Миграции

`synchronize: true` автоматически созда��т таблицы при первом запуске.

**Важно:** В production рекомендуется использовать миграции вместо `synchronize`.
