// Обгортка над window.Telegram.WebApp, щоб решта коду не перевіряла все щоразу.
// Документація: https://core.telegram.org/bots/webapps

export const tg = window.Telegram?.WebApp ?? null

// initData є тільки тоді, коли сторінку відкрито через бота в Telegram.
export const inTelegram = Boolean(tg?.initData)

function supports(version) {
  return Boolean(inTelegram && tg.isVersionAtLeast?.(version))
}

function applyColorScheme() {
  const scheme = inTelegram
    ? tg.colorScheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.dataset.scheme = scheme
}

export function initTelegram() {
  applyColorScheme()

  if (!inTelegram) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyColorScheme)
    return
  }

  tg.ready()
  tg.expand()
  tg.onEvent('themeChanged', applyColorScheme)

  if (supports('6.1')) {
    tg.setHeaderColor('secondary_bg_color')
    tg.setBackgroundColor('secondary_bg_color')
  }
  // Щоб випадковий свайп униз під час прокрутки не закривав застосунок
  if (supports('7.7')) tg.disableVerticalSwipes()
}

/** Вібровідгук: 'success' | 'error' | 'warning' */
export function haptic(type) {
  if (supports('6.1')) tg.HapticFeedback.notificationOccurred(type)
}

export function hapticTap() {
  if (supports('6.1')) tg.HapticFeedback.selectionChanged()
}

/** Нативне вікно підтвердження Telegram (або звичайне в браузері). */
export function confirmDialog(message) {
  return new Promise((resolve) => {
    if (supports('6.2')) tg.showConfirm(message, (ok) => resolve(ok))
    else resolve(window.confirm(message))
  })
}
