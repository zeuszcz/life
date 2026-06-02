# Деплой на VPS (Docker + Caddy)

Цель: `https://life.innertalk.space` на сервере `170.168.72.200`.

## 0. DNS

Создай A-запись `life.innertalk.space → 170.168.72.200`. Caddy не выпустит TLS,
пока домен не резолвится на сервер. Порты **80** и **443** должны быть открыты.

## 1. Установить Docker (Ubuntu/Debian)

```bash
ssh i48ptgvnis@170.168.72.200
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker   # чтобы docker без sudo
```

## 2. Получить код

```bash
git clone https://github.com/zeuszcz/life.git
cd life
```

## 3. Настроить окружение

```bash
cp .env.production.example .env
# Сгенерировать секрет:
echo "AUTH_SECRET=$(openssl rand -base64 32)"
nano .env   # вставить AUTH_SECRET, задать POSTGRES_PASSWORD,
            # при желании AI_PROVIDER=claude|openai + ключ
```

`DATABASE_URL` задавать не нужно — compose собирает его из `POSTGRES_*` и
указывает на сервис `db`.

## 4. Запустить

```bash
docker compose up -d --build
docker compose logs -f web   # дождаться "migrate deploy" и старта Next
```

Что произойдёт:
- `db` — Postgres с volume `pgdata`;
- `web` — соберётся из `Dockerfile`, применит миграции Prisma, само-засеет
  достижения и поднимет Next на :3000;
- `caddy` — проксирует домен на `web:3000` и сам выпустит/обновит сертификат.

Открой `https://life.innertalk.space`.

## Вариант Б: за уже существующим nginx (как на этом VPS)

Если на сервере уже есть nginx на :80/:443 (другие сайты) — Caddy не нужен.
Запускаем только БД и приложение (порт только на localhost), а nginx проксирует.

```bash
cp .env.production.example .env   # задать AUTH_SECRET, POSTGRES_PASSWORD
docker compose -f docker-compose.prod.yml up -d --build   # web -> 127.0.0.1:8092

# vhost (конфиг лежит в репо):
sudo cp deploy/nginx/life.innertalk.space.conf /etc/nginx/sites-available/life.innertalk.space
sudo ln -sf ../sites-available/life.innertalk.space /etc/nginx/sites-enabled/life.innertalk.space
sudo certbot certonly --webroot -w /var/www/certbot -d life.innertalk.space
sudo nginx -t && sudo systemctl reload nginx
```

Порт `8092` можно поменять в `docker-compose.prod.yml` и конфиге nginx (должны совпадать).

## Обновление

```bash
cd life && git pull
docker compose up -d --build
```

## Полезное

```bash
docker compose ps
docker compose logs -f web | caddy
docker compose exec db psql -U life -d life     # консоль БД
docker compose down            # стоп (данные в volume сохраняются)
docker compose run --rm web npx prisma migrate deploy   # ручная миграция
```

## Безопасность

- Смени `POSTGRES_PASSWORD` на длинный случайный.
- Никогда не коммить `.env` (он в `.gitignore`).
- **Поменяй пароль от VPS** — он был передан в открытом виде в чате.
- Включи firewall: разреши только 22/80/443 (`ufw allow 22,80,443/tcp`).
- БД наружу не публикуется (порт 5432 не проброшен — только внутренняя сеть).
