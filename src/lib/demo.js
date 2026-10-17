import { addDays, parseISO, todayISO } from './dates.js'

// Тестові дані для демо-режиму (?demo). Дати рахуються від сьогодні.
const SAMPLE = [
  { title: 'Präsentation Zeitschriftenartikel', subject: 'IT-Recht', offset: 2, time: '10:00' },
  { title: 'Klausuranmeldung im Portal', subject: null, offset: 1 },
  { title: 'Hausarbeit abgeben', subject: 'Marketing', offset: 6, time: '23:59' },
  { title: 'Laborbericht', subject: 'IT-Security', offset: 13 },
  { title: 'Gruppenabgabe Geschäftsmodell', subject: 'Digital Business', offset: 24 },
  { title: 'Übungsblatt 3', subject: 'SCOM', offset: -1 },
  { title: 'Quiz Kapitel 1', subject: 'SCOM', offset: -4, done: true },
]

const SAMPLE_BIRTHDAYS = [
  { name: 'Максим', offset: 3, birth_year: 2001 },
  { name: 'Аня', offset: 12, birth_year: null },
  { name: 'Оля', offset: 45, birth_year: 2003 },
  { name: 'Тато', offset: 140, birth_year: 1972 },
]

const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

/** Простий CRUD у пам'яті */
function memoryStore(initial, defaults) {
  let nextId = initial.length + 1
  let rows = initial.map((row, i) => ({ id: i + 1, ...row }))
  return {
    async list() {
      await wait()
      return rows.map((r) => ({ ...r }))
    },
    async create(fields) {
      await wait()
      const row = { id: nextId++, ...defaults, ...fields }
      rows.push(row)
      return { ...row }
    },
    async update(id, fields) {
      await wait()
      const row = rows.find((r) => r.id === id)
      Object.assign(row, fields)
      return { ...row }
    },
    async remove(id) {
      await wait()
      rows = rows.filter((r) => r.id !== id)
      return { deleted: true }
    },
  }
}

export function createDemoApi() {
  const today = todayISO()

  const deadlines = memoryStore(
    SAMPLE.map((s) => ({
      title: s.title,
      subject: s.subject,
      due_date: addDays(today, s.offset),
      due_time: s.time ?? null,
      done: Boolean(s.done),
    })),
    { done: false, subject: null, due_time: null },
  )

  const birthdays = memoryStore(
    SAMPLE_BIRTHDAYS.map((b) => {
      const { month, day } = parseISO(addDays(today, b.offset))
      return { name: b.name, month: month + 1, day, birth_year: b.birth_year }
    }),
    { birth_year: null },
  )

  return { ...deadlines, birthdays }
}
