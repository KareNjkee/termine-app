<script setup>
import { ref } from 'vue'
import { hapticTap } from '../lib/telegram.js'

// Кнопка видалення з підтвердженням прямо в застосунку
// (не залежить від вікон Telegram, тому не може «зависнути»).
defineProps({
  label: { type: String, required: true }, // напр. «Видалити термін»
  question: { type: String, default: 'Видалити назавжди?' },
  busy: { type: Boolean, default: false }, // іде видалення
  disabled: { type: Boolean, default: false }, // напр. поки зберігається
})
const emit = defineEmits(['confirm'])

const asking = ref(false)

function ask() {
  hapticTap()
  asking.value = true
}
</script>

<template>
  <button v-if="!asking" type="button" class="delete" :disabled="disabled" @click="ask">
    {{ label }}
  </button>

  <div v-else class="confirm" role="group" :aria-label="question">
    <p class="question">{{ question }}</p>
    <div class="buttons">
      <button type="button" class="keep" :disabled="busy" @click="asking = false">Залишити</button>
      <button type="button" class="confirm-delete" :disabled="busy" @click="emit('confirm')">
        {{ busy ? 'Видаляю…' : 'Видалити' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
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

.confirm {
  margin-top: 10px;
  padding: 12px;
  border-radius: 14px;
  background: var(--surface);
}

.question {
  margin: 0 0 10px;
  text-align: center;
  font-weight: 600;
}

.buttons {
  display: flex;
  gap: 8px;
}

.buttons button {
  flex: 1;
  min-height: 44px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
}

.keep {
  background: var(--fill);
  color: var(--text);
}

.confirm-delete {
  background: var(--danger);
  color: #fff;
}

.buttons button:disabled {
  opacity: 0.6;
}
</style>
