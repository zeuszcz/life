# 🎮 Life — игра про тебя

Преврати свою жизнь в RPG. Создай аватара, опиши реальные цели — **ИИ построит
роадмапу** из этапов и квестов. Ходи пиксельным персонажем по миру (вид сверху,
лёгкий наклон для 2.5D), заходи в **Качалку / Работу / Дом / Учёбу**, выполняй
квесты, прокачивай статы, уровень, золото и достижения. Реальные победы и покупки
тоже заносятся в игру.

> Веб-приложение. Подробности архитектуры — в [`docs/PLAN.md`](docs/PLAN.md),
> деплой — в [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Стек

Next.js 16 · React 19 · TypeScript · Tailwind 4 · Phaser 4 · Prisma 7 + PostgreSQL ·
Auth.js v5 · Zod 4 · Zustand · Anthropic/OpenAI SDK (+ mock) · Docker + Caddy.

## Локальная разработка

Нужен Node 22+ и PostgreSQL.

```bash
# 1. Зависимости
npm install

# 2. Окружение
cp .env.example .env
#   - DATABASE_URL на твой Postgres
#   - AUTH_SECRET:  openssl rand -base64 32
#   - AI_PROVIDER=mock  (работает без API-ключей)

# 3. Поднять БД (если есть Docker) — только Postgres:
docker run --name life-db -e POSTGRES_USER=life -e POSTGRES_PASSWORD=life \
  -e POSTGRES_DB=life -p 5432:5432 -d postgres:16-alpine

# 4. Схема + достижения
npm run db:migrate      # создаст таблицы (prisma migrate dev)
npm run db:seed         # засеет достижения (необязательно — также сеется на старте)

# 5. Запуск
npm run dev             # http://localhost:3000
```

### Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | дев-сервер |
| `npm run build` / `start` | прод-сборка / запуск |
| `npm test` | юнит-тесты прогрессии (vitest) |
| `npm run db:migrate` | миграции (dev) |
| `npm run db:deploy` | миграции (prod) |
| `npm run db:seed` | сидинг достижений |
| `npm run db:generate` | генерация Prisma Client |

## ИИ-провайдеры

`AI_PROVIDER=mock|claude|openai`. Для `claude`/`openai` укажи соответствующий
ключ. Если ключа нет — авто-фолбэк на `mock` (детерминированная роадмапа), так
что игра всегда проходится целиком.

## Деплой

Полный прод-стек (Postgres + Next + Caddy с авто-HTTPS) одной командой:

```bash
cp .env.production.example .env   # на сервере; задать AUTH_SECRET
docker compose up -d --build
```

Шаги для VPS и домена `life.innertalk.space` — в [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Управление

- **WASD / стрелки** — движение, **E** — войти в локацию.
- Нижняя панель: 🗺️ Путь · 🛒 Магазин · 📝 Записать · 📊 Профиль.

## Замена графики

Сейчас мир рисуется процедурно (нулевые внешние ассеты). Чтобы подключить
готовые тайлсеты/спрайты (Kenney, LPC) — загрузи их в
`src/game/scenes/BootScene.ts` под теми же ключами текстур (`grass`, `player_0`…).
