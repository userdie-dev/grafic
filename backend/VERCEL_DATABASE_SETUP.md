# Настройка DATABASE_URL для Vercel

## Проблема
Vercel возвращает `500 FUNCTION_INVOCATION_FAILED` потому что:
1. SQLite не работает на serverless (read-only filesystem)
2. DATABASE_URL не установлена в переменных окружения Vercel

## Решение

### Вариант 1: Использовать существующую Neon БД (РЕКОМЕНДУЕТСЯ)

У вас уже есть DATABASE_URL в `.env`:
```
postgresql://neondb_owner:npg_8ltvRKfQzyC3@ep-damp-darkness-babjqs6y-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Шаги:**
1. Откройте https://vercel.com/dashboard
2. Найдите проект `grafic-delta`
3. Перейдите в **Settings → Environment Variables**
4. Добавьте новую переменную:
   - Name: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_8ltvRKfQzyC3@ep-damp-darkness-babjqs6y-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - Environments: выберите **Production**, **Preview**, **Development**
5. Нажмите **Save**
6. Перейдите в **Deployments**
7. Найдите последний деплой → три точки (•••) → **Redeploy**

### Вариант 2: Создать новую БД

#### Neon (бесплатно, 0.5GB)
1. https://neon.tech → Sign up
2. Create Project
3. Скопируйте Connection String
4. Добавьте как `DATABASE_URL` в Vercel (шаги выше)

#### Supabase (бесплатно, 500MB)
1. https://supabase.com → New Project
2. Settings → Database → Connection String → URI
3. Добавьте как `DATABASE_URL` в Vercel

#### Vercel Postgres (платно, $0.30/GB)
1. В проекте Vercel: Storage → Create Database → Postgres
2. Переменная `POSTGRES_URL` автоматически добавится
3. Переименуйте её в `DATABASE_URL` или измените код

## Проверка

После redeploy проверьте:
```bash
curl https://grafic-delta.vercel.app/
```

Если всё работает, вы увидите JSON с данными, а не 500 ошибку.

## Отладка

Теперь в коде добавлено логирование. Чтобы посмотреть логи:
1. Vercel Dashboard → проект → Deployments
2. Кликните на последний деплой
3. Перейдите на вкладку **Functions**
4. Кликните на `/api/index`
5. Смотрите логи в реальном времени

Или через CLI (после установки `npm i -g vercel`):
```bash
vercel logs grafic-delta
```
