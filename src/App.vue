<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import ListView from './components/ListView.vue'
import CalendarView from './components/CalendarView.vue'
import DeadlineSheet from './components/DeadlineSheet.vue'
import ThemeMenu from '../../../Downloads/update-theme/update-theme/src/components/ThemeMenu.vue'
import { api, apiConfigured, demoMode } from './lib/api.js'
import { confirmDialog, haptic, hapticTap, inTelegram } from '../../../Downloads/update-theme/update-theme/src/lib/telegram.js'
import { assignSubjectColors, knownSubjects } from './lib/subjects.js'
import { formatDayMonth, todayISO } from './lib/dates.js'

const canUse = inTelegram || demoMode

const deadlines = ref([])
const loading = ref(true)
const loadError = ref('')
const view = ref('list') // 'list' | 'calendar'
const today = ref(todayISO())
const selectedDate = ref(todayISO())
const sheet = ref(null) // null, або { item, presetDate }
const toast = ref('')
let toastTimer = null

const subjects = computed(() => knownSubjects(deadlines.value))
watchEffect(() => assignSubjectColors(deadlines.value))
const addLabel = computed(() =>
  view.value === 'calendar' ? `Додати на ${formatDayMonth(selectedDate.value)}` : 'Додати термін',
)

// Терміни без часу — у кінці свого дня
const timeKey = (time) => time ?? '99:99'

function sortDeadlines() {
  deadlines.value.sort(
    (a, b) =>
      a.due_date.localeCompare(b.due_date) ||
      timeKey(a.due_time).localeCompare(timeKey(b.due_time)) ||
      a.id - b.id,
  )
}

function showToast(text) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2200)
}

async function load() {
  if (!demoMode && !apiConfigured) {
    loadError.value = 'Вкажи адресу своєї функції в src/config.js (API_URL).'
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    deadlines.value = await api.list()
    sortDeadlines()
  } catch (error) {
    loadError.value = error.message
  } finally {
    loading.value = false
  }
}

function setView(next) {
  if (view.value === next) return
  hapticTap()
  view.value = next
}

function openCreate() {
  hapticTap()
  sheet.value = { item: null, presetDate: view.value === 'calendar' ? selectedDate.value : null }
}

function openEdit(item) {
  hapticTap()
  sheet.value = { item, presetDate: null }
}

async function saveDeadline(fields) {
  const current = sheet.value?.item
  if (current) {
    Object.assign(current, await api.update(current.id, fields))
  } else {
    deadlines.value.push(await api.create(fields))
  }
  sortDeadlines()
  sheet.value = null
  haptic('success')
  showToast('Збережено')
}

async function deleteDeadline() {
  const current = sheet.value?.item
  if (!current) return
  const confirmed = await confirmDialog(`Видалити «${current.title}»?`)
  if (!confirmed) return
  await api.remove(current.id)
  deadlines.value = deadlines.value.filter((d) => d.id !== current.id)
  sheet.value = null
  haptic('success')
  showToast('Видалено')
}

async function toggleDone(item) {
  const done = !item.done
  item.done = done // одразу показуємо зміну, сервер підтвердить
  done ? haptic('success') : hapticTap()
  try {
    await api.update(item.id, { done })
    showToast(done ? 'Позначено виконаним' : 'Повернуто в список')
  } catch (error) {
    item.done = !done
    haptic('error')
    showToast(error.message)
  }
}

// Якщо застосунок довго відкритий (наприклад, після півночі), оновлюємо «сьогодні»
function onVisible() {
  if (document.visibilityState === 'visible') today.value = todayISO()
}

onMounted(() => {
  if (canUse) load()
  document.addEventListener('visibilitychange', onVisible)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisible)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div v-if="!canUse" class="app gate">
    <h1>Терміни</h1>
    <p>Відкрий цей застосунок через свого бота в Telegram: кнопка «Терміни» біля поля вводу.</p>
    <p class="gate-hint">
      Щоб подивитися інтерфейс у браузері з тестовими даними, додай до адреси <code>?demo</code>.
    </p>
  </div>

  <div v-else class="app">
    <header class="top">
      <div class="title-row">
        <h1>Терміни</h1>
        <ThemeMenu />
      </div>
      <div class="segmented" role="tablist" aria-label="Вигляд">
        <button
          type="button"
          role="tab"
          :aria-selected="view === 'list'"
          :class="{ active: view === 'list' }"
          @click="setView('list')"
        >
          Список
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="view === 'calendar'"
          :class="{ active: view === 'calendar' }"
          @click="setView('calendar')"
        >
          Календар
        </button>
      </div>
    </header>

    <p v-if="demoMode" class="demo-note">Демо-режим: тестові дані, нічого не зберігається.</p>

    <main>
      <p v-if="loading" class="status">Завантажую терміни…</p>

      <div v-else-if="loadError" class="status">
        <p class="status-error">{{ loadError }}</p>
        <button class="chip" type="button" @click="load">Спробувати ще раз</button>
      </div>

      <ListView
        v-else-if="view === 'list'"
        :deadlines="deadlines"
        :today="today"
        @open="openEdit"
        @toggle="toggleDone"
      />

      <CalendarView
        v-else
        v-model:selected="selectedDate"
        :deadlines="deadlines"
        :today="today"
        @open="openEdit"
        @toggle="toggleDone"
      />
    </main>

    <Transition name="toast">
      <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    </Transition>

    <footer v-if="!loading && !loadError" class="bottom-bar">
      <button class="primary-button" type="button" @click="openCreate">{{ addLabel }}</button>
    </footer>

    <Transition name="sheet">
      <DeadlineSheet
        v-if="sheet"
        :item="sheet.item"
        :preset-date="sheet.presetDate"
        :subjects="subjects"
        :today="today"
        :save="saveDeadline"
        :remove="deleteDeadline"
        @close="sheet = null"
      />
    </Transition>
  </div>
</template>

<style>
.app {
  max-width: 560px;
  margin: 0 auto;
  padding: 0 12px calc(100px + var(--safe-bottom));
}

.top {
  padding: 16px 4px 8px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.top h1,
.gate h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.segmented {
  display: flex;
  padding: 2px;
  border-radius: var(--radius-control);
  background: var(--fill);
}

.segmented button {
  flex: 1;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--hint);
}

:root[data-scheme='dark'] .segmented button.active {
  background: rgba(255, 255, 255, 0.13);
}

.segmented button.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.demo-note {
  margin: 0 4px 6px;
  font-size: 13px;
  color: var(--hint);
}

.status {
  padding: 48px 16px;
  text-align: center;
  color: var(--hint);
}

.status-error {
  margin: 0 auto 14px;
  max-width: 34ch;
  color: var(--danger);
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 10px 12px calc(10px + var(--safe-bottom));
  background: var(--bg);
  border-top: 1px solid var(--sep);
}

.bottom-bar .primary-button {
  max-width: 536px;
  margin: 0 auto;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(84px + var(--safe-bottom));
  z-index: 15;
  max-width: calc(100% - 32px);
  padding: 9px 16px;
  border-radius: 12px;
  background: var(--text);
  color: var(--surface);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  font-size: 14px;
  transform: translateX(-50%);
}

.gate {
  padding-top: 40px;
}

.gate p {
  max-width: 36ch;
}

.gate-hint {
  color: var(--hint);
  font-size: 14px;
}

/* Анімації: аркуш виїжджає знизу, підказка з'являється */
.sheet-enter-active,
.sheet-leave-active {
  transition: background-color 0.28s ease;
}
.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.app .overlay.sheet-enter-from,
.app .overlay.sheet-leave-to {
  background-color: rgba(0, 0, 0, 0);
}
.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
