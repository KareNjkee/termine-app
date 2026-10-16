<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { addDays, daysBetween, formatLong, reminderText } from '../lib/dates.js'
import { subjectHue } from '../lib/subjects.js'

const props = defineProps({
  item: { type: Object, default: null }, // null = новий термін
  presetDate: { type: String, default: null },
  subjects: { type: Array, default: () => [] },
  today: { type: String, required: true },
  save: { type: Function, required: true },
  remove: { type: Function, required: true },
})
const emit = defineEmits(['close'])

const isEdit = computed(() => props.item !== null)
const title = ref(props.item?.title ?? '')
const subject = ref(props.item?.subject ?? '')
const dueDate = ref(props.item?.due_date ?? props.presetDate ?? addDays(props.today, 7))
const busy = ref(false)
const error = ref('')
const titleInput = ref(null)

const quickDates = computed(() => [
  { label: 'Завтра', iso: addDays(props.today, 1) },
  { label: 'Через тиждень', iso: addDays(props.today, 7) },
  { label: 'Через 2 тижні', iso: addDays(props.today, 14) },
])

const subjectChips = computed(() => props.subjects.slice(0, 8))

const reminders = computed(() => {
  if (!dueDate.value) return ''
  if (daysBetween(props.today, dueDate.value) < 0) return 'Ця дата вже минула.'
  const when = reminderText(dueDate.value, props.today)
  return when ? `Бот нагадає ${when}.` : 'Нагадувань не буде: термін уже зовсім близько.'
})

function toggleSubject(name) {
  subject.value = subject.value === name ? '' : name
}

async function handleSubmit() {
  error.value = ''
  if (!title.value.trim()) {
    error.value = 'Напиши, що треба зробити.'
    titleInput.value?.focus()
    return
  }
  if (!dueDate.value) {
    error.value = 'Обери дату.'
    return
  }

  busy.value = true
  try {
    await props.save({
      title: title.value.trim(),
      subject: subject.value.trim() || null,
      due_date: dueDate.value,
    })
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function handleDelete() {
  error.value = ''
  busy.value = true
  try {
    await props.remove()
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
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
    titleInput.value?.focus()
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
      :aria-label="isEdit ? 'Редагувати термін' : 'Новий термін'"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <header class="sheet-head">
        <button type="button" class="link" @click="emit('close')">Скасувати</button>
        <h2>{{ isEdit ? 'Редагувати термін' : 'Новий термін' }}</h2>
        <span class="link placeholder" aria-hidden="true">Скасувати</span>
      </header>

      <div class="section fields">
        <label class="field">
          <span class="field-label">Що зробити</span>
          <input
            ref="titleInput"
            v-model="title"
            maxlength="200"
            placeholder="Напр., Präsentation"
            autocomplete="off"
            enterkeyhint="next"
          />
        </label>
        <label class="field">
          <span class="field-label">Предмет</span>
          <input v-model="subject" maxlength="100" placeholder="Необов’язково" autocomplete="off" />
        </label>
      </div>

      <div v-if="subjectChips.length" class="chips" aria-label="Предмети, що вже є">
        <button
          v-for="name in subjectChips"
          :key="name"
          type="button"
          class="chip"
          :class="{ active: subject === name }"
          @click="toggleSubject(name)"
        >
          <span class="subject-dot" :style="{ '--hue': subjectHue(name) }" />
          {{ name }}
        </button>
      </div>

      <div class="section fields">
        <label class="field">
          <span class="field-label">Дата</span>
          <input v-model="dueDate" type="date" required />
        </label>
      </div>

      <div class="chips" aria-label="Швидкий вибір дати">
        <button
          v-for="quick in quickDates"
          :key="quick.label"
          type="button"
          class="chip"
          :class="{ active: dueDate === quick.iso }"
          @click="dueDate = quick.iso"
        >
          {{ quick.label }}
        </button>
      </div>

      <p v-if="dueDate" class="hint">{{ formatLong(dueDate) }}. {{ reminders }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button class="primary-button" type="submit" :disabled="busy">
        {{ busy ? 'Зберігаю…' : 'Зберегти' }}
      </button>
      <button v-if="isEdit" type="button" class="delete" :disabled="busy" @click="handleDelete">
        Видалити термін
      </button>
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

.field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 16px 10px;
}

.field + .field {
  border-top: 1px solid var(--sep);
}

.field-label {
  font-size: 13px;
  color: var(--hint);
}

.field input {
  width: 100%;
  min-width: 0;
  min-height: 26px;
  padding: 2px 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 17px;
}

.field input::placeholder {
  color: var(--hint);
  opacity: 0.7;
}

.field:focus-within {
  box-shadow: inset 3px 0 0 var(--accent);
}

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 2px 14px;
  scrollbar-width: none;
}

.chips .chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.delete {
  display: block;
  width: 100%;
  min-height: 46px;
  margin-top: 8px;
  font-size: 16px;
  color: var(--danger);
}

.delete:disabled {
  opacity: 0.5;
}
</style>
