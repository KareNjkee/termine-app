import { API_URL } from '../config.js'
import { tg, inTelegram } from './telegram.js'
import { createDemoApi } from './demo.js'

// Демо-режим для розробки в браузері: http://localhost:5173/?demo
// Дані тільки в пам'яті, до бази нічого не йде.
export const demoMode = !inTelegram && new URLSearchParams(location.search).has('demo')

export const apiConfigured = !API_URL.includes('YOUR-PROJECT')

async function request(method, { id, body } = {}) {
  const url = id ? `${API_URL}?id=${encodeURIComponent(id)}` : API_URL
  let response
  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Підписані Telegram дані: за ними сервер перевіряє, що це ти
        'X-Telegram-Init-Data': tg?.initData ?? '',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Не вдалося зв’язатися із сервером. Перевір інтернет і API_URL у src/config.js.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error ?? `Сервер відповів кодом ${response.status}.`)
  return data
}

const remoteApi = {
  list: () => request('GET'),
  create: (fields) => request('POST', { body: fields }),
  update: (id, fields) => request('PATCH', { id, body: fields }),
  remove: (id) => request('DELETE', { id }),
}

export const api = demoMode ? createDemoApi() : remoteApi
