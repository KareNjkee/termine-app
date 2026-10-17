<script setup>
import { computed } from 'vue'
import { plural } from '../lib/dates.js'
import { daysUntilBirthday, formatBirthday, nextBirthday, turningAge } from '../lib/birthdays.js'

const props = defineProps({
  person: { type: Object, required: true },
  today: { type: String, required: true },
  showDate: { type: Boolean, default: true },
})
const emit = defineEmits(['open'])

const daysLeft = computed(() => daysUntilBirthday(props.person, props.today))
const age = computed(() => turningAge(props.person, nextBirthday(props.person, props.today)))

// Лічильник праворуч, як у термінів: велике число + підпис
const countdown = computed(() => {
  const n = daysLeft.value
  if (n === 0) return { value: '🎉', label: 'сьогодні' }
  if (n === 1) return { value: '1', label: 'завтра' }
  return { value: String(n), label: plural(n, ['день', 'дні', 'днів']) }
})

const details = computed(() => {
  const parts = []
  if (props.showDate) parts.push(formatBirthday(props.person))
  if (age.value !== null) parts.push(`виповнюється ${age.value}`)
  return parts.join(', ')
})
</script>

<template>
  <button class="birthday-row" :class="{ today: daysLeft === 0 }" type="button" @click="emit('open', person)">
    <span class="cake" aria-hidden="true">🎂</span>
    <span class="body">
      <span class="name">{{ person.name }}</span>
      <span v-if="details" class="details">{{ details }}</span>
    </span>
    <span class="count tabular" :aria-label="daysLeft === 0 ? 'сьогодні' : `через ${countdown.value} ${countdown.label}`">
      <span class="value">{{ countdown.value }}</span>
      <span class="label">{{ countdown.label }}</span>
    </span>
  </button>
</template>

<style scoped>
.birthday-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 10px 12px;
  text-align: left;
}

.birthday-row + .birthday-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: 66px;
  right: 0;
  height: 1px;
  background: var(--sep);
}

.cake {
  flex: none;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--fill);
  font-size: 21px;
}

.today .cake {
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.today .name {
  font-weight: 600;
}

.details {
  font-size: 14px;
  color: var(--hint);
}

.count {
  flex: none;
  min-width: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
}

.label {
  font-size: 11px;
  line-height: 1.25;
  color: var(--hint);
}

.today .label {
  color: var(--accent);
  font-weight: 600;
}
</style>
