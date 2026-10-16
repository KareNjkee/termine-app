import { ref } from 'vue'
import { supports, tg, inTelegram } from './telegram.js'

// Тема застосунку:
//   'auto'  — як у Telegram (у браузері — як у системі)
//   'light' — завжди світла
//   'dark'  — завжди темна
// Вибір зберігається в localStorage (миттєво при запуску) і в хмарному сховищі
// Telegram (CloudStorage), щоб був однаковий на телефоні й комп'ютері.

const KEY = 'termine-theme'
const MODES = ['auto', 'light', 'dark']
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function readLocal() {
  try {
    const value = localStorage.getItem(KEY)
    return MODES.includes(value) ? value : 'auto'
  } catch {
    return 'auto'
  }
}

function writeLocal(mode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // localStorage недоступний — не страшно, є CloudStorage
  }
}

export const themeMode = ref(readLocal())

export function applyTheme() {
  const root = document.documentElement
  const mode = themeMode.value

  if (mode === 'auto') {
    root.dataset.scheme = inTelegram ? tg.colorScheme : darkQuery.matches ? 'dark' : 'light'
    delete root.dataset.forced // кольори беремо з теми Telegram
  } else {
    root.dataset.scheme = mode
    root.dataset.forced = '' // кольори беремо з власної палітри (style.css)
  }

  // Колір шапки й фону самого Telegram навколо застосунку
  if (supports('6.1')) {
    if (mode === 'auto') {
      tg.setHeaderColor('secondary_bg_color')
      tg.setBackgroundColor('secondary_bg_color')
    } else {
      const bg = getComputedStyle(root).getPropertyValue('--fb-bg').trim()
      tg.setHeaderColor(bg)
      tg.setBackgroundColor(bg)
    }
  }
}

export function setTheme(mode) {
  if (!MODES.includes(mode)) return
  themeMode.value = mode
  writeLocal(mode)
  if (supports('6.9')) tg.CloudStorage.setItem(KEY, mode)
  applyTheme()
}

export function initTheme() {
  applyTheme()

  // Тема Telegram або системи змінилась — важливо для режиму 'auto'
  if (inTelegram) tg.onEvent('themeChanged', applyTheme)
  darkQuery.addEventListener('change', applyTheme)

  // Вибір, збережений на іншому пристрої
  if (supports('6.9')) {
    tg.CloudStorage.getItem(KEY, (error, value) => {
      if (error || !MODES.includes(value) || value === themeMode.value) return
      themeMode.value = value
      writeLocal(value)
      applyTheme()
    })
  }
}
