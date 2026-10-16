import { computed, ref } from 'vue'
import { supports, tg, inTelegram } from './telegram.js'

// Тема застосунку: 'light' або 'dark'.
// Поки ти не вибрав тему кнопкою, береться поточна тема Telegram (у браузері — системи).
// Після вибору він зберігається в localStorage (миттєво при запуску) і в хмарному
// сховищі Telegram (CloudStorage), щоб був однаковий на телефоні й комп'ютері.

const KEY = 'termine-theme'
const MODES = ['light', 'dark']
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function readLocal() {
  try {
    const value = localStorage.getItem(KEY)
    return MODES.includes(value) ? value : null
  } catch {
    return null
  }
}

function writeLocal(mode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // localStorage недоступний — не страшно, є CloudStorage
  }
}

function currentOuterScheme() {
  if (inTelegram) return tg.colorScheme === 'dark' ? 'dark' : 'light'
  return darkQuery.matches ? 'dark' : 'light'
}

const savedMode = ref(readLocal()) // null = ще не вибирали
const outerScheme = ref(currentOuterScheme())

export const themeMode = computed(() => savedMode.value ?? outerScheme.value)

export function applyTheme() {
  const root = document.documentElement
  root.dataset.scheme = themeMode.value
  root.dataset.forced = '' // завжди власна палітра зі style.css

  // Колір шапки й фону самого Telegram навколо застосунку
  if (supports('6.1')) {
    const bg = getComputedStyle(root).getPropertyValue('--fb-bg').trim()
    tg.setHeaderColor(bg)
    tg.setBackgroundColor(bg)
  }
}

export function setTheme(mode) {
  if (!MODES.includes(mode)) return
  savedMode.value = mode
  writeLocal(mode)
  if (supports('6.9')) tg.CloudStorage.setItem(KEY, mode)
  applyTheme()
}

export function toggleTheme() {
  setTheme(themeMode.value === 'dark' ? 'light' : 'dark')
}

export function initTheme() {
  applyTheme()

  // Поки тему не вибрано, слідуємо за Telegram/системою
  const followOuter = () => {
    outerScheme.value = currentOuterScheme()
    applyTheme()
  }
  if (inTelegram) tg.onEvent('themeChanged', followOuter)
  darkQuery.addEventListener('change', followOuter)

  // Вибір, збережений на іншому пристрої
  if (supports('6.9')) {
    tg.CloudStorage.getItem(KEY, (error, value) => {
      if (error || !MODES.includes(value) || value === savedMode.value) return
      savedMode.value = value
      writeLocal(value)
      applyTheme()
    })
  }
}