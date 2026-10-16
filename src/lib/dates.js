// Дати зберігаються як рядки 'YYYY-MM-DD' (як у колонці due_date).
// Різницю в днях рахуємо через UTC, щоб перехід на літній/зимовий час нічого не ламав.

const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
]
const MONTHS_GENITIVE = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
]
const WEEKDAYS_SHORT = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
const WEEKDAYS_LONG = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота']

export const WEEK_HEADER = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

const pad = (n) => String(n).padStart(2, '0')

export function toISO(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export function todayISO() {
  const now = new Date()
  return toISO(now.getFullYear(), now.getMonth(), now.getDate())
}

export function parseISO(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month: month - 1, day }
}

function utc(iso) {
  const { year, month, day } = parseISO(iso)
  return Date.UTC(year, month, day)
}

export function daysBetween(fromISO, toISOString) {
  return Math.round((utc(toISOString) - utc(fromISO)) / 86_400_000)
}

export function addDays(iso, days) {
  const date = new Date(utc(iso) + days * 86_400_000)
  return toISO(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function weekday(iso) {
  return new Date(utc(iso)).getUTCDay()
}

/** "пт, 23 жовтня" */
export function formatShort(iso) {
  const { month, day } = parseISO(iso)
  return `${WEEKDAYS_SHORT[weekday(iso)]}, ${day} ${MONTHS_GENITIVE[month]}`
}

/** "Пʼятниця, 23 жовтня" */
export function formatLong(iso) {
  const { month, day } = parseISO(iso)
  const name = WEEKDAYS_LONG[weekday(iso)]
  return `${name[0].toUpperCase()}${name.slice(1)}, ${day} ${MONTHS_GENITIVE[month]}`
}

/** '23:59:00' або '23:59' → '23:59'; порожньо, якщо часу немає */
export function formatTime(time) {
  return time ? time.slice(0, 5) : ''
}

/** "23 жовтня" */
export function formatDayMonth(iso) {
  const { month, day } = parseISO(iso)
  return `${day} ${MONTHS_GENITIVE[month]}`
}

/**
 * Дні, коли бот надішле нагадування (за 7, 2 і 1 день), тільки ті, що ще попереду.
 * Повертає текст на кшталт "16, 21 і 22 жовтня" або null, якщо нагадувань не буде.
 */
export function reminderText(dueISO, today, offsets = [7, 2, 1]) {
  const dates = offsets
    .map((offset) => addDays(dueISO, -offset))
    .filter((iso) => daysBetween(today, iso) > 0)
  if (dates.length === 0) return null

  const parts = dates.map(parseISO)
  const sameMonth = parts.every((p) => p.month === parts[0].month)
  const items = sameMonth ? parts.map((p) => String(p.day)) : dates.map(formatDayMonth)
  const joined = items.length > 1 ? `${items.slice(0, -1).join(', ')} і ${items.at(-1)}` : items[0]
  return sameMonth ? `${joined} ${MONTHS_GENITIVE[parts[0].month]}` : joined
}

/** "Жовтень 2026" */
export function monthTitle(year, month) {
  return `${MONTHS[month]} ${year}`
}

/** Українська множина: plural(5, ['день', 'дні', 'днів']) → 'днів' */
export function plural(n, [one, few, many]) {
  const lastTwo = Math.abs(n) % 100
  const last = lastTwo % 10
  if (lastTwo > 10 && lastTwo < 20) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

const DAY_FORMS = ['день', 'дні', 'днів']

/**
 * Що показати в лічильнику біля терміну.
 * tone визначає колір: urgent (0–1 день або прострочено), soon (2–3), week (до 7), later.
 */
export function countdown(daysLeft) {
  if (daysLeft < 0) {
    const n = -daysLeft
    return { value: n, label: `${plural(n, DAY_FORMS)} тому`, tone: 'urgent' }
  }
  if (daysLeft === 0) return { value: 0, label: 'сьогодні', tone: 'urgent' }
  if (daysLeft === 1) return { value: 1, label: 'завтра', tone: 'urgent' }
  return {
    value: daysLeft,
    label: plural(daysLeft, DAY_FORMS),
    tone: daysLeft <= 3 ? 'soon' : daysLeft <= 7 ? 'week' : 'later',
  }
}
