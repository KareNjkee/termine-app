<script setup>
import { computed } from 'vue'
import { countdown, daysBetween, formatShort } from '../lib/dates.js'
import { subjectHue } from '../lib/subjects.js'

const props = defineProps({
  item: { type: Object, required: true },
  today: { type: String, required: true },
  showDate: { type: Boolean, default: true },
})
const emit = defineEmits(['open', 'toggle'])

const info = computed(() => countdown(daysBetween(props.today, props.item.due_date)))
const hue = computed(() => subjectHue(props.item.subject))
</script>

<template>
  <div class="row" :class="{ done: item.done }">
    <button class="main" type="button" @click="emit('open', item)">
      <span v-if="!item.done" class="count tabular" :class="`tone-${info.tone}`">
        <span class="value">{{ info.value }}</span>
        <span class="label">{{ info.label }}</span>
      </span>
      <span class="body">
        <span class="title">{{ item.title }}</span>
        <span v-if="item.subject || showDate" class="meta">
          <span v-if="item.subject" class="subject">
            <span class="subject-dot" :style="{ '--hue': hue }" />{{ item.subject }}
          </span>
          <span v-if="showDate">{{ formatShort(item.due_date) }}</span>
        </span>
      </span>
    </button>
    <button
      class="check"
      type="button"
      :aria-pressed="item.done"
      :aria-label="item.done ? 'Повернути в список' : 'Позначити виконаним'"
      @click="emit('toggle', item)"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path v-if="item.done" d="M7.5 12.4l3.1 3.1 6-6.6" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.row {
  position: relative;
  display: flex;
  align-items: stretch;
}

.row + .row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 0;
  height: 1px;
  background: var(--sep);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0 11px 12px;
  text-align: left;
}

.done .main {
  padding-left: 16px;
}

.count {
  flex: none;
  width: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--tone);
}

.value {
  font-size: 23px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
}

.label {
  font-size: 11px;
  line-height: 1.25;
  color: var(--hint);
  text-align: center;
}

.tone-urgent .label {
  color: var(--tone);
}

.body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 12px;
  row-gap: 2px;
  font-size: 14px;
  color: var(--hint);
}

.subject {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text);
  opacity: 0.8;
}

.check {
  flex: none;
  width: 54px;
  display: grid;
  place-items: center;
  color: var(--hint);
}

.check svg {
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.done .check circle {
  fill: var(--accent);
  stroke: var(--accent);
}

.done .check path {
  stroke: var(--accent-text);
  stroke-width: 2.2;
}

.done .title {
  color: var(--hint);
  text-decoration: line-through;
}

.done .subject {
  color: var(--hint);
}
</style>
