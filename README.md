# 🎮 Game Platform

Полноценная игровая платформа с мини-играми, тёмной неон-темой и мультиплеером в реальном времени.

> A full-stack cyberpunk-themed game platform with real-time multiplayer mini-games.

---

## 🚀 Как запустить / How to Run

### Вариант 1 — Docker (рекомендуется / recommended)

**Требования:** [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Ruslan040107/tasks.git
cd tasks

# 2. Запустить все сервисы одной командой
docker-compose up --build
```

После запуска откройте в браузере:
- 🌐 **Сайт:** http://localhost:5173
- 🔌 **API:** http://localhost:3001

Остановить: `docker-compose down`

---

### Вариант 2 — Ручной запуск (Manual Setup)

**Требования:** Node.js 18+, PostgreSQL 15+

#### Шаг 1 — База данных

Создайте базу данных PostgreSQL:
```sql
CREATE USER gameuser WITH PASSWORD 'gamepassword';
CREATE DATABASE gameplatform OWNER gameuser;
```

#### Шаг 2 — Общие типы (shared)

```bash
cd shared
npm install
npm run build
cd ..
```

#### Шаг 3 — Бэкенд (server)

```bash
cd server

# Установить зависимости
npm install

# Скопировать и настроить переменные окружения
cp .env.example .env
# Отредактируйте .env — укажите свои DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

Содержимое `.env` (минимум):
```env
DATABASE_URL="postgresql://gameuser:gamepassword@localhost:5432/gameplatform"
JWT_ACCESS_SECRET="любой-секретный-ключ"
JWT_REFRESH_SECRET="другой-секретный-ключ"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

```bash
# Сгенерировать Prisma клиент и применить миграции
npx prisma generate
npx prisma migrate dev --name init

# Запустить бэкенд (режим разработки)
npm run dev
```

Бэкенд будет доступен по адресу: http://localhost:3001

#### Шаг 4 — Фронтенд (client)

Откройте **новый терминал**:

```bash
cd client

# Установить зависимости
npm install

# (Опционально) создать .env файл
cp .env.example .env
# По умолчанию уже настроено на localhost:3001

# Запустить фронтенд (режим разработки)
npm run dev
```

Сайт будет доступен по адресу: http://localhost:5173

---

## 🎮 Игры / Games

| Игра | Управление | Описание |
|------|-----------|----------|
| **2048** | ← → ↑ ↓ / свайп | Складывай плитки, набирай 2048 |
| **Snake** | WASD / стрелки | Классическая змейка, 3 уровня скорости |
| **Крестики-нолики** | Мышь | Против бота (minimax AI) или друга онлайн |

---

## 📁 Структура проекта / Project Structure

```
/
├── client/          # React + Vite + TypeScript (фронтенд)
├── server/          # Express + TypeScript + Prisma (бэкенд)
├── shared/          # Общие TypeScript-типы
├── docker-compose.yml
└── README.md
```

---

## 🛠 Технологии / Tech Stack

| Часть | Технологии |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Zustand, React Router v6 |
| **Backend** | Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, JWT, Socket.io |
| **DevOps** | Docker, docker-compose, ESLint, Prettier |

---

## 🔌 API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/api/auth/register` | Регистрация |
| `POST` | `/api/auth/login` | Вход |
| `POST` | `/api/auth/logout` | Выход |
| `POST` | `/api/auth/refresh` | Обновить токен |
| `GET` | `/api/users/:id` | Профиль пользователя |
| `PUT` | `/api/users/:id` | Обновить профиль |
| `GET` | `/api/users/:id/stats` | Статистика |
| `GET` | `/api/games` | Список игр |
| `POST` | `/api/games/:slug/score` | Сохранить результат |
| `GET` | `/api/games/:slug/leaderboard` | Таблица лидеров |

**WebSocket события:** `join_room`, `leave_room`, `make_move`, `game_state`, `chat_message`

---

## ❓ Частые вопросы / FAQ

**Q: `prisma migrate dev` выдаёт ошибку подключения**  
A: Убедитесь, что PostgreSQL запущен и `DATABASE_URL` в `.env` указывает на правильный хост/порт/базу.

**Q: Порт 5432/3001/5173 уже занят**  
A: Измените порт в `docker-compose.yml` (левая часть `"5432:5432"`) или в `.env` файле.

**Q: Как остановить Docker?**  
A: `docker-compose down` — остановить контейнеры, `docker-compose down -v` — также удалить данные БД.
