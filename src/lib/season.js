// Пори року для оформлення. month — номер місяця від 0 (січень) до 11 (грудень).

export const SEASONS = {
  winter: { name: 'Зима', motif: 'snow' },
  spring: { name: 'Весна', motif: 'blossom' },
  summer: { name: 'Літо', motif: 'sun' },
  autumn: { name: 'Осінь', motif: 'leaf' },
}

export function seasonOf(month) {
  if (month === 11 || month <= 1) return 'winter'
  if (month <= 4) return 'spring'
  if (month <= 7) return 'summer'
  return 'autumn'
}
