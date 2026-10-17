import { API_URL } from '../config.js'
import { tg, inTelegram } from './telegram.js'
import { createDemoApi } from './demo.js'

// Демо-режим для розробки в браузері: http://localhost:5173/?demo
// Дані тільки в пам'яті, до бази нічого не йде.
export const demoMode = !inTelegram && new URLSearchParams(location.search).has('demo')

export const apiConfigured = !API_URL.includes('YOUR-PROJECT')

const REQUEST_TIMEOUT_MS = 15_000

async function request(method, { id, body, resource } = {}) {
  const params = new URLSearchParams()
  if (resource) params.set('resource', resource)
  if (id) params.set('id', id)
  const query = params.toString()
  const url = query ? `${API_URL}?${query}` : API_URL
  // Не чекаємо вічно: через 15 секунд запит переривається з помилкою
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

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
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Сервер не відповідає. Спробуй ще раз за хвилину.')
    throw new Error('Не вдалося зв’язатися із сервером. Перевір інтернет і API_URL у src/config.js.')
  } finally {
    clearTimeout(timer)
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

  // Дні народження: ті самі запити з ?resource=birthdays
  birthdays: {
    list: () => request('GET', { resource: 'birthdays' }),
    create: (fields) => request('POST', { resource: 'birthdays', body: fields }),
    update: (id, fields) => request('PATCH', { resource: 'birthdays', id, body: fields }),
    remove: (id) => request('DELETE', { resource: 'birthdays', id }),
  },
}

export const api = demoMode ? createDemoApi() : remoteApi
