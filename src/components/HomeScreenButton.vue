<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { hapticTap, supports, tg } from '../lib/telegram.js'

// Кнопка «Додати на головний екран» (Telegram 8.0+, тільки телефони).
// Показується, лише коли Telegram каже, що іконку можна додати і її ще немає.
// Якщо Telegram не може перевірити, чи іконка вже є ('unknown'), ховаємо кнопку
// після першого натискання і запам'ятовуємо це на цьому пристрої.
const KEY = 'termine-home-screen'
const visible = ref(false)

function remembered() {
  try {
    return localStorage.getItem(KEY) === 'done'
  } catch {
    return false
  }
}

function remember() {
  try {
    localStorage.setItem(KEY, 'done')
  } catch {
    // не страшно: кнопка просто з'явиться знову
  }
}

function onAdded() {
  visible.value = false
  remember()
}

onMounted(() => {
  if (!supports('8.0') || typeof tg.checkHomeScreenStatus !== 'function') return
  tg.onEvent('homeScreenAdded', onAdded)
  tg.checkHomeScreenStatus((status) => {
    visible.value = status === 'missed' || (status === 'unknown' && !remembered())
  })
})

onBeforeUnmount(() => {
  if (supports('8.0')) tg.offEvent?.('homeScreenAdded', onAdded)
})

function add() {
  hapticTap()
  tg.addToHomeScreen()
  remember()
}
</script>

<template>
  <button
    v-if="visible"
    type="button"
    class="home-button"
    aria-label="Додати на головний екран"
    title="Додати на головний екран"
    @click="add"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M12 8.5v6M9 11.5h6" />
    </svg>
  </button>
</template>

<style scoped>
.home-button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--fill);
  color: var(--text);
}

.home-button svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
