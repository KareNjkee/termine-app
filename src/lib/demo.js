import { addDays, todayISO } from './dates.js'

// Тестові дані для демо-режиму (?demo). Дати рахуються від сьогодні.
const SAMPLE = [
  { title: 'Präsentation Zeitschriftenartikel', subject: 'IT-Recht', offset: 2 },
  { title: 'Klausuranmeldung im Portal', subject: null, offset: 1 },
  { title: 'Hausarbeit abgeben', subject: 'Marketing', offset: 6 },
  { title: 'Laborbericht', subject: 'IT-Security', offset: 13 },
  { title: 'Gruppenabgabe Geschäftsmodell', subject: 'Digital Business', offset: 24 },
  { title: 'Übungsblatt 3', subject: 'SCOM', offset: -1 },
  { title: 'Quiz Kapitel 1', subject: 'SCOM', offset: -4, done: true },
]

const wait = () => new Promise((resolve) => setTimeout(resolve, 250))

export function createDemoApi() {
  const today = todayISO()
  let nextId = 1
  let rows = SAMPLE.map((s) => ({
    id: nextId++,
    title: s.title,
    subject: s.subject,
    due_date: addDays(today, s.offset),
    done: Boolean(s.done),
  }))

  return {
    async list() {
      await wait()
      return rows.map((r) => ({ ...r }))
    },
    async create(fields) {
      await wait()
      const row = { id: nextId++, done: false, subject: null, ...fields }
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
