<script setup>
import { computed, ref } from 'vue'
import DeadlineRow from './DeadlineRow.vue'
import { countdown, daysBetween, formatLong } from '../lib/dates.js'
import { subjectHue } from '../lib/subjects.js'

const props = defineProps({
  deadlines: { type: Array, required: true }, // уже відсортовані за датою
  today: { type: String, required: true },
})
const emit = defineEmits(['open', 'toggle'])

const showDone = ref(false)

const open = computed(() =>
  props.deadlines
    .filter((item) => !item.done)
    .map((item) => ({ item, days: daysBetween(props.today, item.due_date) })),
)
const upcoming = computed(() => open.value.filter((x) => x.days >= 0))

// Найближчий термін показуємо великим зверху, у списках нижче його вже немає
const next = computed(() => upcoming.value[0] ?? null)
const nextInfo = computed(() => (next.value ? countdown(next.value.days) : null))

const overdue = computed(() => open.value.filter((x) => x.days < 0).map((x) => x.item))
const thisWeek = computed(() => upcoming.value.slice(1).filter((x) => x.days <= 7).map((x) => x.item))
const later = computed(() => upcoming.value.slice(1).filter((x) => x.days > 7).map((x) => x.item))
const done = computed(() =>
  props.deadlines.filter((item) => item.done).sort((a, b) => b.due_date.localeCompare(a.due_date)),
)

const groups = computed(() =>
  [
    { key: 'overdue', title: 'Прострочено', items: overdue.value },
    { key: 'week', title: 'Цього тижня', items: thisWeek.value },
    { key: 'later', title: 'Пізніше', items: later.value },
  ].filter((group) => group.items.length > 0),
)
</script>

<template>
  <div>
    <button
      v-if="next"
      class="hero"
      :class="`tone-${nextInfo.tone}`"
      type="button"
      @click="emit('open', next.item)"
    >
      <span class="hero-count tabular">
        <span class="hero-value">{{ nextInfo.value }}</span>
        <span class="hero-label">{{ nextInfo.label }}</span>
      </span>
      <span class="hero-body">
        <span class="hero-title">{{ next.item.title }}</span>
        <span v-if="next.item.subject" class="hero-subject">
          <span class="subject-dot" :style="{ '--hue': subjectHue(next.item.subject) }" />
          {{ next.item.subject }}
        </span>
        <span class="hero-date">{{ formatLong(next.item.due_date) }}</span>
      </span>
    </button>

    <div v-if="open.length === 0" class="empty">
      <template v-if="done.length > 0">
        <p class="empty-title">Усе виконано</p>
        <p>Відкритих термінів немає. Додай наступний, коли він з’явиться.</p>
      </template>
      <template v-else>
        <p class="empty-title">Тут будуть твої терміни</p>
        <p>Додай перший, і бот нагадає про нього за 7, 2 і 1 день.</p>
      </template>
    </div>

    <section v-for="group in groups" :key="group.key">
      <h2 class="section-title" :class="{ danger: group.key === 'overdue' }">{{ group.title }}</h2>
      <div class="section">
        <DeadlineRow
          v-for="item in group.items"
          :key="item.id"
          :item="item"
          :today="today"
          @open="emit('open', $event)"
          @toggle="emit('toggle', $event)"
        />
      </div>
    </section>

    <section v-if="done.length > 0">
      <button class="done-toggle" type="button" :aria-expanded="showDone" @click="showDone = !showDone">
        <span>Виконано: {{ done.length }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" :class="{ open: showDone }">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
      <div v-if="showDone" class="section">
        <DeadlineRow
          v-for="item in done"
          :key="item.id"
          :item="item"
          :today="today"
          @open="emit('open', $event)"
          @toggle="emit('toggle', $event)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 20px 20px 18px;
  margin-top: 6px;
  border-radius: 20px;
  background: var(--surface);
  text-align: left;
}

.hero-count {
  flex: none;
  min-width: 78px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--tone);
}

.hero-value {
  font-size: 64px;
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.04em;
}

.hero-label {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 500;
}

.hero-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-left: 18px;
  border-left: 1px solid var(--sep);
}

.hero-title {
  font-size: 19px;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.hero-subject {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 15px;
}

.hero-date {
  font-size: 15px;
  color: var(--hint);
}

@media (max-width: 360px) {
  .hero {
    gap: 12px;
    padding: 16px 14px 16px 10px;
  }
  .hero-count {
    min-width: 64px;
  }
  .hero-value {
    font-size: 52px;
  }
  .hero-body {
    padding-left: 12px;
  }
  .hero-title {
    font-size: 17px;
  }
}

.section-title.danger {
  color: var(--urgent);
}

.empty {
  padding: 48px 24px 24px;
  text-align: center;
  color: var(--hint);
}

.empty p {
  margin: 0 auto;
  max-width: 30ch;
}

.empty .empty-title {
  margin-bottom: 6px;
  font-size: 19px;
  font-weight: 600;
  color: var(--text);
}

.done-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 22px 16px 7px;
  font-size: 14px;
  color: var(--hint);
}

.done-toggle svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  transition: transform 0.2s;
}

.done-toggle svg.open {
  transform: rotate(90deg);
}
</style>
