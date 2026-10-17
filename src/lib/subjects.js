import { reactive } from 'vue'

// Кожен предмет отримує свій колір. Кольори роздаються по черзі в порядку,
// в якому предмети з'явились (за id терміну), тож перші 8 предметів завжди різні.
const HUES = [212, 28, 150, 268, 330, 185, 48, 0]

const assigned = reactive(new Map())
const keyOf = (subject) => subject.trim().toLowerCase()

/** Викликається з App.vue щоразу, коли змінюється список термінів. */
export function assignSubjectColors(deadlines) {
  const byAge = [...deadlines].sort((a, b) => a.id - b.id)
  for (const item of byAge) {
    if (!item.subject) continue
    const key = keyOf(item.subject)
    if (!assigned.has(key)) assigned.set(key, HUES[assigned.size % HUES.length])
  }
}

export function subjectHue(subject) {
  if (!subject) return null
  const key = keyOf(subject)
  if (assigned.has(key)) return assigned.get(key)
  // Новий предмет, якого ще немає в списку (наприклад, під час введення)
  let hash = 0
  for (const char of key) hash = (hash * 31 + char.codePointAt(0)) >>> 0
  return HUES[hash % HUES.length]
}
