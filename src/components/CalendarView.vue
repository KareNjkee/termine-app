<script setup>
import { computed, ref, watch } from 'vue'
import DeadlineRow from './DeadlineRow.vue'
import BirthdayRow from './BirthdayRow.vue'
import SeasonBand from './SeasonBand.vue'
import { WEEK_HEADER, formatLong, parseISO, toISO } from '../lib/dates.js'
import { subjectHue } from '../lib/subjects.js'
import { birthdayInYear, birthdaysOn } from '../lib/birthdays.js'
import { hapticTap } from '../lib/telegram.js'

const props = defineProps({
  deadlines: { type: Array, required: true },
  birthdays: { type: Array, default: () => [] },
  today: { type: String, required: true },
})
const emit = defineEmits(['open', 'toggle', 'open-birthday', 'month'])

// Обраний день живе в App.vue, щоб кнопка «Додати» знала дату
const selected = defineModel('selected', { type: String, required: true })

const start = parseISO(selected.value)
const cursor = ref({ year: start.year, month: start.month })

watch(selected, (iso) => {
  const { year, month } = parseISO(iso)
  cursor.value = { year, month }
})

// App.vue фарбує застосунок у пору року показаного місяця
watch(() => cursor.value.month, (month) => emit('month', month), { immediate: true })

const byDate = computed(() => {
  const map = new Map()
  for (const item of props.deadlines) {
    if (!map.has(item.due_date)) map.set(item.due_date, [])
    map.get(item.due_date).push(item)
  }
  return map
})

// Дні народження в показаному місяці: дата → кількість (щороку на той самий день)
const birthdayCount = computed(() => {
  const { year, month } = cursor.value
  const map = new Map()
  for (const person of props.birthdays) {
    if (person.month !== month + 1) continue
    const iso = birthdayInYear(year, person.month, person.day)
    map.set(iso, (map.get(iso) ?? 0) + 1)
  }
  return map
})

const cells = computed(() => {
  const { year, month } = cursor.value
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7 // тиждень з понеділка
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const list = Array.from({ length: leadingBlanks }, (_, i) => ({ key: `blank-${i}`, blank: true }))
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toISO(year, month, day)
    const openItems = (byDate.value.get(iso) ?? []).filter((item) => !item.done)
    list.push({
      key: iso,
      iso,
      day,
      count: openItems.length,
      birthdays: birthdayCount.value.get(iso) ?? 0,
      dots: openItems.slice(0, 3).map((item) => subjectHue(item.subject)),
    })
  }
  return list
})

const selectedItems = computed(() => byDate.value.get(selected.value) ?? [])
const selectedBirthdays = computed(() => birthdaysOn(props.birthdays, selected.value))
const showTodayButton = computed(() => selected.value !== props.today)

function shiftMonth(delta) {
  hapticTap()
  const date = new Date(cursor.value.year, cursor.value.month + delta, 1)
  cursor.value = { year: date.getFullYear(), month: date.getMonth() }
}

function select(iso) {
  hapticTap()
  selected.value = iso
}

// Свайп уліво/вправо гортає місяці
let touchX = null
function onTouchStart(event) {
  touchX = event.touches[0].clientX
}
function onTouchEnd(event) {
  if (touchX === null) return
  const dx = event.changedTouches[0].clientX - touchX
  touchX = null
  if (Math.abs(dx) > 60) shiftMonth(dx < 0 ? 1 : -1)
}

function dayLabel(cell) {
  const parts = [formatLong(cell.iso)]
  if (cell.count) parts.push(`термінів: ${cell.count}`)
  if (cell.birthdays) parts.push(`днів народження: ${cell.birthdays}`)
  return parts.join(', ')
}
</script>

<template>
  <div>
    <div class="month-area" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <SeasonBand
        :year="cursor.year"
        :month="cursor.month"
        @prev="shiftMonth(-1)"
        @next="shiftMonth(1)"
      />

      <div class="section calendar">
        <div class="grid weekdays" aria-hidden="true">
          <span v-for="name in WEEK_HEADER" :key="name">{{ name }}</span>
        </div>

        <div class="grid days">
          <template v-for="cell in cells" :key="cell.key">
            <span v-if="cell.blank" />
            <button
              v-else
              type="button"
              class="day"
              :class="{
                selected: cell.iso === selected,
                today: cell.iso === today,
                past: cell.iso < today,
              }"
              :aria-label="dayLabel(cell)"
              :aria-pressed="cell.iso === selected"
              @click="select(cell.iso)"
            >
              <span class="num tabular">
                {{ cell.day }}
                <span v-if="cell.birthdays" class="cake" aria-hidden="true">🎂</span>
              </span>
              <span class="dots">
                <span
                  v-for="(hue, i) in cell.dots"
                  :key="i"
                  class="dot"
                  :style="hue === null ? null : { '--hue': hue }"
                />
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <div class="day-head">
      <h2 class="section-title">{{ formatLong(selected) }}</h2>
      <button v-if="showTodayButton" class="chip" type="button" @click="select(today)">Сьогодні</button>
    </div>

    <div v-if="selectedBirthdays.length" class="section day-birthdays">
      <BirthdayRow
        v-for="person in selectedBirthdays"
        :key="person.id"
        :person="person"
        :today="today"
        :show-date="false"
        @open="emit('open-birthday', $event)"
      />
    </div>

    <div v-if="selectedItems.length" class="section">
      <DeadlineRow
        v-for="item in selectedItems"
        :key="item.id"
        :item="item"
        :today="today"
        :show-date="false"
        @open="emit('open', $event)"
        @toggle="emit('toggle', $event)"
      />
    </div>
    <p v-else-if="!selectedBirthdays.length" class="nothing">На цей день нічого немає.</p>
  </div>
</template>

<style scoped>
.month-area {
  margin-top: 6px;
  user-select: none;
}

.calendar {
  margin-top: 12px;
  padding: 12px 8px 8px;
  border-radius: 22px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.weekdays span {
  padding-bottom: 6px;
  font-size: 12px;
  text-align: center;
  color: var(--hint);
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 3px 0 5px;
}

.num {
  position: relative;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 16px;
}

/* 🎂 у правому верхньому куті дня */
.cake {
  position: absolute;
  top: -5px;
  right: -7px;
  font-size: 13px;
  line-height: 1;
  pointer-events: none;
}

.day-birthdays {
  margin-bottom: 10px;
}

.day.past .num {
  color: var(--hint);
}

.day.today .num {
  box-shadow: inset 0 0 0 2px var(--accent);
  color: var(--accent);
  font-weight: 700;
}

.day.selected .num {
  box-shadow: none;
  background: var(--accent);
  color: var(--accent-text);
  font-weight: 600;
}

.dots {
  display: flex;
  gap: 3px;
  height: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: hsl(var(--hue) 70% var(--subject-l));
}

.dot:not([style]) {
  background: var(--hint);
}

.day.past .dot {
  opacity: 0.6;
}

.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 4px;
}

.day-head .chip {
  margin-top: 14px;
  font-size: 13px;
  padding: 4px 10px;
}

.nothing {
  margin: 4px 16px;
  color: var(--hint);
}
</style>
