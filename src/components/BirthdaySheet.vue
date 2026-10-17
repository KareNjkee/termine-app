<script setup>
import DeleteButton from './DeleteButton.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MONTHS, formatShort, parseISO } from '../lib/dates.js'
import { isLeapYear, maxDayInMonth, nextBirthday } from '../lib/birthdays.js'

const props = defineProps({
  item: { type: Object, default: null }, // null = новий день народження
  today: { type: String, required: true },
  save: { type: Function, required: true },
  remove: { type: Function, required: true },
})
const emit = defineEmits(['close'])

const isEdit = computed(() => props.item !== null)
const currentYear = parseISO(props.today).year

const name = ref(props.item?.name ?? '')
const month = ref(props.item?.month ?? null) // 1–12
const day = ref(props.item?.day ?? null)
const birthYear = ref(props.item?.birth_year ? String(props.item.birth_year) : '')
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const nameInput = ref(null)

const dayOptions = computed(() => {
  const max = month.value ? maxDayInMonth(month.value) : 31
  return Array.from({ length: max }, (_, i) => i + 1)
})

// Помилка зникає, щойно щось виправили
watch([name, month, day, birthYear], () => {
  error.value = ''
})

// Якщо змінили місяць на коротший (31 → квітень), підрізаємо день
watch(month, () => {
  if (day.value && month.value && day.value > maxDayInMonth(month.value)) {
    day.value = maxDayInMonth(month.value)
  }
})

const parsedYear = computed(() => {
  const text = birthYear.value.trim()
  return /^\d{4}$/.test(text) ? Number(text) : null
})

const hint = computed(() => {
  if (!month.value || !day.value) return ''
  const next = nextBirthday({ month: month.value, day: day.value }, props.today)
  const date = formatShort(next)
  if (parsedYear.value && parsedYear.value <= currentYear) {
    return `Наступний: ${date}, виповнюється ${parseISO(next).year - parsedYear.value}.`
  }
  return `Наступний: ${date}.`
})

function validate() {
  if (!name.value.trim()) return 'Вкажи ім’я.'
  if (!month.value || !day.value) return 'Обери день і місяць.'
  const text = birthYear.value.trim()
  if (text) {
    const year = parsedYear.value
    if (!year || year < 1900 || year > currentYear) return `Рік має бути від 1900 до ${currentYear}.`
    if (month.value === 2 && day.value === 29 && !isLeapYear(year)) return `У ${year} році не було 29 лютого.`
  }
  return ''
}

async function handleSubmit() {
  error.value = validate()
  if (error.value) return
  saving.value = true
  try {
    await props.save({
      name: name.value.trim(),
      month: month.value,
      day: day.value,
      birth_year: parsedYear.value,
    })
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  error.value = ''
  deleting.value = true
  try {
    await props.remove()
  } catch (e) {
    error.value = e.message
  } finally {
    deleting.value = false
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(async () => {
  document.body.classList.add('sheet-open')
  window.addEventListener('keydown', onKeydown)
  if (!isEdit.value) {
    await nextTick()
    nameInput.value?.focus()
  }
})

onBeforeUnmount(() => {
  document.body.classList.remove('sheet-open')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <form
      class="sheet"
      role="dialog"
      aria-modal="true"
      :aria-label="isEdit ? 'Редагувати день народження' : 'Новий день народження'"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <header class="sheet-head">
        <button type="button" class="link" @click="emit('close')">Закрити</button>
        <h2>День народження</h2>
        <span class="link placeholder" aria-hidden="true">Закрити</span>
      </header>

      <div class="section fields">
        <label class="field">
          <span class="field-label">Ім’я</span>
          <input ref="nameInput" v-model="name" maxlength="100" autocomplete="off" />
        </label>
      </div>

      <div class="section fields date-fields">
        <label class="field">
          <span class="field-label">День</span>
          <select v-model.number="day" aria-label="День">
            <option :value="null" disabled>—</option>
            <option v-for="d in dayOptions" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
        <label class="field month-field">
          <span class="field-label">Місяць</span>
          <select v-model.number="month" aria-label="Місяць">
            <option :value="null" disabled>—</option>
            <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
          </select>
        </label>
      </div>

      <div class="section fields">
        <label class="field">
          <span class="field-label">Рік народження (необов’язково)</span>
          <input
            v-model="birthYear"
            inputmode="numeric"
            maxlength="4"
            autocomplete="off"
          />
        </label>
      </div>

      <p v-if="hint" class="hint">
        {{ hint }} Бот нагадає за 7 днів і в сам день близько 06:00.
      </p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button class="primary-button" type="submit" :disabled="saving || deleting">
        {{ saving ? 'Зберігаю…' : 'Зберегти' }}
      </button>
      <DeleteButton
        v-if="isEdit"
        label="Видалити день народження"
        :busy="deleting"
        :disabled="saving"
        @confirm="handleDelete"
      />
    </form>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}

.sheet {
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 8px 14px calc(16px + var(--safe-bottom));
  border-radius: 18px 18px 0 0;
  background: var(--bg);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 2px 14px;
}

.sheet-head h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
}

.link {
  font-size: 16px;
  color: var(--accent);
}

.placeholder {
  visibility: hidden;
}

.fields {
  margin-bottom: 10px;
}

.date-fields {
  display: flex;
}

.date-fields .field {
  flex: 1;
}

.date-fields .month-field {
  flex: 2;
  border-left: 1px solid var(--sep);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 16px 10px;
}

.field-label {
  font-size: 13px;
  color: var(--hint);
}

.field input,
.field select {
  width: 100%;
  min-width: 0;
  min-height: 26px;
  padding: 2px 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 17px;
}

.field select {
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.field:focus-within {
  box-shadow: inset 3px 0 0 var(--accent);
}

.hint {
  margin: 0 4px 14px;
  font-size: 14px;
  color: var(--hint);
}

.error {
  margin: 0 4px 12px;
  font-size: 14px;
  color: var(--danger);
}

</style>
