<script setup>
import { computed, ref, watch } from 'vue'
import DeadlineRow from './DeadlineRow.vue'
import { WEEK_HEADER, formatLong, monthTitle, parseISO, toISO } from '../lib/dates.js'
import { subjectHue } from '../lib/subjects.js'
import { hapticTap } from '../lib/telegram.js'

const props = defineProps({
  deadlines: { type: Array, required: true },
  today: { type: String, required: true },
})
const emit = defineEmits(['open', 'toggle'])

// Обраний день живе в App.vue, щоб кнопка «Додати» знала дату
const selected = defineModel('selected', { type: String, required: true })

const start = parseISO(selected.value)
const cursor = ref({ year: start.year, month: start.month })

watch(selected, (iso) => {
  const { year, month } = parseISO(iso)
  cursor.value = { year, month }
})

const byDate = computed(() => {
  const map = new Map()
  for (const item of props.deadlines) {
    if (!map.has(item.due_date)) map.set(item.due_date, [])
    map.get(item.due_date).push(item)
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
      dots: openItems.slice(0, 3).map((item) => subjectHue(item.subject)),
    })
  }
  return list
})

const selectedItems = computed(() => byDate.value.get(selected.value) ?? [])
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
  return cell.count ? `${formatLong(cell.iso)}, термінів: ${cell.count}` : formatLong(cell.iso)
}
</script>

<template>
  <div>
    <div class="section calendar" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div class="month-bar">
        <button class="nav" type="button" aria-label="Попередній місяць" @click="shiftMonth(-1)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <h2 class="month">{{ monthTitle(cursor.year, cursor.month) }}</h2>
        <button class="nav" type="button" aria-label="Наступний місяць" @click="shiftMonth(1)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

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
            <span class="num tabular">{{ cell.day }}</span>
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

    <div class="day-head">
      <h2 class="section-title">{{ formatLong(selected) }}</h2>
      <button v-if="showTodayButton" class="chip" type="button" @click="select(today)">Сьогодні</button>
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
    <p v-else class="nothing">На цей день нічого немає.</p>
  </div>
</template>

<style scoped>
.calendar {
  margin-top: 6px;
  padding: 8px 8px 10px;
  user-select: none;
}

.month-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 8px;
}

.month {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.nav {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--accent);
}

.nav svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
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
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 16px;
}

.day.past .num {
  color: var(--hint);
}

.day.today .num {
  color: var(--accent);
  font-weight: 700;
}

.day.selected .num {
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
