// Обгортка над window.Telegram.WebApp, щоб решта коду не перевіряла все щоразу.
// Документація: https://core.telegram.org/bots/webapps

export const tg = window.Telegram?.WebApp ?? null

// initData є тільки тоді, коли сторінку відкрито через бота в Telegram.
export const inTelegram = Boolean(tg?.initData)

/** Чи підтримує поточна версія Telegram цю можливість */
export function supports(version) {
  return Boolean(inTelegram && tg.isVersionAtLeast?.(version))
}

export function initTelegram() {
  if (!inTelegram) return
  tg.ready()
  tg.expand()
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
