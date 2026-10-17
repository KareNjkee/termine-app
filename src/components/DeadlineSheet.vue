<script setup>
import DeleteButton from './DeleteButton.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { addDays, daysBetween, formatLong, formatTime, reminderText } from '../lib/dates.js'

const props = defineProps({
  item: { type: Object, default: null }, // null = новий термін
  presetDate: { type: String, default: null },
  today: { type: String, required: true },
  save: { type: Function, required: true },
  remove: { type: Function, required: true },
})
const emit = defineEmits(['close'])

const isEdit = computed(() => props.item !== null)
const title = ref(props.item?.title ?? '')
const subject = ref(props.item?.subject ?? '')
const dueDate = ref(props.item?.due_date ?? props.presetDate ?? addDays(props.today, 7))
const dueTime = ref(formatTime(props.item?.due_time)) // '' = без часу
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const titleInput = ref(null)

const reminders = computed(() => {
  if (!dueDate.value) return ''
  if (daysBetween(props.today, dueDate.value) < 0) return 'Ця дата вже минула.'
  const when = reminderText(dueDate.value, props.today)
  return when ? `Бот нагадає ${when}.` : 'Нагадувань не буде: термін уже зовсім близько.'
})

async function handleSubmit() {
  error.value = ''
  if (!title.value.trim()) {
    error.value = 'Вкажи назву терміну.'
    titleInput.value?.focus()
    return
  }
  if (!dueDate.value) {
    error.value = 'Обери дату.'
    return
  }

  saving.value = true
  try {
    await props.save({
      title: title.value.trim(),
      subject: subject.value.trim() || null,
      due_date: dueDate.value,
      due_time: dueTime.value || null,
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
        <button type="button" class="link" @click="emit('close')">Закрити</button>
        <h2>{{ isEdit ? 'Редагувати термін' : 'Новий термін' }}</h2>
        <span class="link placeholder" aria-hidden="true">Закрити</span>
      </header>

      <div class="section fields">
        <label class="field">
          <span class="field-label">Назва терміну</span>
          <input
            ref="titleInput"
            v-model="title"
            maxlength="200"
            autocomplete="off"
            enterkeyhint="next"
          />
        </label>
        <label class="field">
          <span class="field-label">Детальніше (необов’язково)</span>
          <input v-model="subject" maxlength="100" autocomplete="off" />
        </label>
      </div>

      <div class="section fields">
        <label class="field">
          <span class="field-label">Дата</span>
          <input v-model="dueDate" type="date" required />
        </label>
        <div class="field time-field">
          <label class="time-input">
            <span class="field-label">Час (необов’язково)</span>
            <input v-model="dueTime" type="time" />
          </label>
          <button
            v-if="dueTime"
            type="button"
            class="clear-time"
            aria-label="Прибрати час"
            @click="dueTime = ''"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
          </button>
        </div>
      </div>

      <p v-if="dueDate" class="hint">
        {{ formatLong(dueDate) }}<template v-if="dueTime">, {{ dueTime }}</template>. {{ reminders }}
      </p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button class="primary-button" type="submit" :disabled="saving || deleting">
        {{ saving ? 'Зберігаю…' : 'Зберегти' }}
      </button>
      <DeleteButton
        v-if="isEdit"
        label="Видалити термін"
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

.field:focus-within {
  box-shadow: inset 3px 0 0 var(--accent);
}

.time-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.time-input {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.clear-time {
  flex: none;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--fill);
  color: var(--hint);
}

.clear-time svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
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
