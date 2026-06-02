# Life — план и архитектура

## Идея

Веб-игра про саморазвитие. Игрок создаёт аватара и описывает свои реальные
жизненные цели. Подключённый ИИ превращает цели в **роадмапу**: этапы
(milestones) и конкретные **квесты**. Игрок ходит пиксельным персонажем по миру
с видом сверху (slightly oblique, 2.5D), заходит в локации (**Качалка / Работа /
Дом / Учёба**) и выполняет квесты — прокачивая статы, уровень, золото и
достижения. Реальные достижения и покупки тоже заносятся в игру.

Цель — воспринимать жизнь как игру и развивать себя как персонажа.

## Стек

- **Next.js 16** (App Router, RSC, server actions) + **React 19** + **TypeScript**
- **Tailwind CSS 4** — UI, кастомная игровая тема в `globals.css`
- **Phaser 4** — игровой мир (рендер на клиенте, динамический импорт)
- **Prisma 7 + PostgreSQL** — данные
- **Auth.js v5 (next-auth)** — credentials-аутентификация (email+пароль, bcrypt, JWT)
- **Zod 4** — валидация на всех границах
- **Zustand + mitt** — клиентское состояние и шина событий Phaser↔React
- **Anthropic / OpenAI SDK** — генерация роадмапы (+ mock-провайдер без ключей)
- **Docker + Caddy** — деплой с авто-HTTPS

## Архитектура

```
src/
  app/
    page.tsx                 # лендинг (редиректит залогиненных)
    (auth)/login, register   # формы (server actions + useActionState)
    (app)/onboarding         # создание персонажа + ввод целей + генерация
    (app)/play               # игровой экран (Phaser + HUD + панели)
    (app)/dashboard          # профиль: статы, достижения, инвентарь, лента
    api/auth/[...nextauth]   # хендлеры Auth.js
  auth.config.ts             # edge-safe конфиг (для middleware)
  auth.ts                    # node-инстанс с Credentials provider
  middleware.ts              # защита /play /onboarding /dashboard
  instrumentation.ts         # self-seed достижений при старте
  components/
    AvatarPreview.tsx        # HTML-превью пиксельного аватара
    GameCanvas.tsx           # монтирование Phaser (client-only)
    onboarding/, play/       # UI-компоненты
  game/                      # Phaser: сцены (Boot/World), createGame
  lib/
    game/constants.ts        # домены, локации, награды (общие)
    game/progression.ts      # чистая математика XP/уровней (юнит-тесты)
    game/catalog.ts          # магазин
    game/achievements.ts     # каталог достижений (данные)
    prisma.ts, store.ts, event-bus.ts, types.ts, zod-schemas.ts
  server/
    ai/                      # AIProvider: claude | openai | mock + промпт/схема
    services/                # progression, roadmap (бизнес-логика + БД)
    actions/                 # server actions (auth, character, goals, quests, shop, play)
```

### Домены ↔ локации

| Домен      | Локация  | Стат      |
|------------|----------|-----------|
| fitness    | Качалка  | Сила      |
| career     | Работа   | Доход     |
| wellbeing  | Дом      | Гармония  |
| knowledge  | Учёба    | Мудрость  |

## Модель данных (Prisma)

`User → Character (1:1) → Stat[] / InventoryItem[]`,
`User → Goal[]`, `User → Roadmap → Milestone[] → Quest[]`,
`AchievementDef ← UserAchievement → User`, `ActivityLog`.

Enum-подобные поля хранятся как `String` и валидируются Zod — схема портативная,
миграции без трения.

## ИИ-движок роадмапы

`AIProvider` — общий интерфейс (`generateRoadmap(input) → RoadmapResult`).
Реализации:
- **claude** — forced tool use + prompt caching;
- **openai** — structured outputs (strict JSON schema);
- **mock** — детерминированный план без ключей (дефолт).

Выбор через `AI_PROVIDER`. Если у выбранного провайдера нет ключа — авто-фолбэк
на mock, поэтому приложение всегда работает end-to-end. Результат валидируется
Zod-схемой и сохраняется как Milestones+Quests (локация выводится из домена).

## Прогрессия

Чистые функции в `lib/game/progression.ts` (cost/threshold/level/progress/applyXp),
покрыты `vitest`. Выполнение квеста начисляет XP персонажу и доменному стату,
золото, пишет `ActivityLog`, пересчитывает уровни и проверяет достижения.
Daily/weekly квесты имеют кулдаун.

## Фазы

0. **Скаффолд** — Next/TS/Tailwind, структура, конфиги. ✅
1. **БД + auth + персонаж** — Prisma, Auth.js, создание аватара. ✅
2. **Цели + ИИ-роадмапа** — визард, провайдеры, генерация и сохранение. ✅
3. **Игровой мир** — Phaser-сцена, аватар, 4 здания, коллизии, камера. ✅
4. **Интеграция игра↔данные** — шина событий, панели локаций, выполнение. ✅
5. **Прогрессия + дашборд** — XP/уровни/золото, достижения, магазин, профиль. ✅
6. **Деплой** — Docker, Postgres, Caddy, домен `life.innertalk.space`. ✅

## Идеи на будущее

- Спрайтовые ассеты (Kenney/LPC) вместо процедурной графики — загрузить в
  `BootScene` под теми же ключами текстур.
- OAuth-провайдеры (адаптер Prisma уже совместим).
- Стрики/напоминания, ежедневный «логин-бонус».
- Перестроение роадмапы по прогрессу, под-цели, дедлайны.
- Мебель из инвентаря, отображаемая в комнатах игры.
