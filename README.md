# termine-app

Telegram Mini App для моїх термінів: список, календар, додавання й редагування.
Нагадування за 7, 2 і 1 день надсилає окремий скрипт у репозиторії `termine-bot`.

**Стек:** Vue 3 + Vite, Telegram Web Apps API, Supabase Edge Function, GitHub Pages.

## Як це працює

```
Telegram → Mini App (GitHub Pages) → Edge Function deadlines-api → таблиця deadlines (Supabase)
                                     ↑ перевіряє підпис Telegram і мій Telegram ID
```

Mini App не має жодних ключів до бази. Кожен запит несе `initData`, підписану Telegram,
і функція пропускає тільки запити з моїм Telegram ID.

## Налаштування

1. У `src/config.js` вписати адресу Edge Function (`API_URL`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Після кожного push у `main` сайт збирається і публікується автоматично.

## Локальна розробка

```bash
npm install
npm run dev
```

Відкрити `http://localhost:5173/?demo`: інтерфейс з тестовими даними, без сервера.
