// Дні народження зберігаються як { name, month (1–12), day, birth_year | null }.
// Року в даті немає, тож день народження повторюється щороку.

import { MONTHS_GENITIVE, daysBetween, parseISO, toISO } from './dates.js'

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Скільки днів може бути в місяці (лютий — 29, бо люди народжуються й 29 лютого). */
export function maxDayInMonth(month) {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
}

/** Дата дня народження в конкретному році. 29 лютого в невисокосний рік → 28 лютого. */
export function birthdayInYear(year, month, day) {
  const realDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day
  return toISO(year, month - 1, realDay)
}

/** Найближча дата дня народження, починаючи з today. */
export function nextBirthday(person, today) {
  const { year } = parseISO(today)
  const thisYear = birthdayInYear(year, person.month, person.day)
  return thisYear >= today ? thisYear : birthdayInYear(year + 1, person.month, person.day)
}

export function daysUntilBirthday(person, today) {
  return daysBetween(today, nextBirthday(person, today))
}

/** Скільки виповнюється в день народження, що припадає на дату `on`, або null. */
export function turningAge(person, on) {
  return person.birth_year ? parseISO(on).year - person.birth_year : null
}

/** У кого день народження саме в цю дату. */
export function birthdaysOn(people, iso) {
  const { year } = parseISO(iso)
  return people.filter((p) => birthdayInYear(year, p.month, p.day) === iso)
}

/** Від найближчого дня народження до найдальшого. */
export function sortByNext(people, today) {
  return [...people].sort(
    (a, b) =>
      daysUntilBirthday(a, today) - daysUntilBirthday(b, today) || a.name.localeCompare(b.name),
  )
}

/** "20 березня" */
export function formatBirthday(person) {
  return `${person.day} ${MONTHS_GENITIVE[person.month - 1]}`
}
