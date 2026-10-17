<script setup>
import { computed } from 'vue'
import BirthdayRow from './BirthdayRow.vue'
import { daysUntilBirthday, sortByNext } from '../lib/birthdays.js'

const props = defineProps({
  birthdays: { type: Array, required: true },
  today: { type: String, required: true },
  error: { type: String, default: '' },
})
const emit = defineEmits(['open'])

const sorted = computed(() => sortByNext(props.birthdays, props.today))
// Найближчий місяць — окремо, решта — нижче
const soon = computed(() => sorted.value.filter((p) => daysUntilBirthday(p, props.today) <= 30))
const later = computed(() => sorted.value.filter((p) => daysUntilBirthday(p, props.today) > 30))
</script>

<template>
  <div>
    <p v-if="error" class="message error">{{ error }}</p>

    <div v-else-if="birthdays.length === 0" class="empty">
      <p class="empty-title">Тут будуть дні народження</p>
      <p>Додай перший, і бот нагадає за 7 днів і в сам день зранку.</p>
    </div>

    <template v-else>
      <section v-if="soon.length">
        <h2 class="section-title">Найближчий місяць</h2>
        <div class="section">
          <BirthdayRow v-for="p in soon" :key="p.id" :person="p" :today="today" @open="emit('open', $event)" />
        </div>
      </section>
      <section v-if="later.length">
        <h2 class="section-title">Пізніше</h2>
        <div class="section">
          <BirthdayRow v-for="p in later" :key="p.id" :person="p" :today="today" @open="emit('open', $event)" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
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

.message {
  margin: 24px 8px;
  text-align: center;
}

.message.error {
  color: var(--danger);
}
</style>
