<script setup>
import { computed } from 'vue'
import { themeMode, toggleTheme } from '../lib/theme.js'
import { hapticTap } from '../lib/telegram.js'

// Кнопка-перемикач: показує тему, на яку перемкне (☾ у світлій, ☀ у темній)
const isDark = computed(() => themeMode.value === 'dark')
const label = computed(() => (isDark.value ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'))

function onClick() {
  hapticTap()
  toggleTheme()
}
</script>

<template>
  <button type="button" class="theme-button" :aria-label="label" :title="label" @click="onClick">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <template v-if="isDark">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
      </template>
      <path v-else d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  </button>
</template>

<style scoped>
.theme-button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--fill);
  color: var(--text);
}

.theme-button svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
