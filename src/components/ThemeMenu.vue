<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { setTheme, themeMode } from '../lib/theme.js'
  import { hapticTap } from '../lib/telegram.js'

const OPTIONS = [
  { value: 'auto', label: 'Як у Telegram' },
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
]

const open = ref(false)
const currentLabel = computed(() => OPTIONS.find((o) => o.value === themeMode.value)?.label)

function toggle() {
  hapticTap()
  open.value = !open.value
}

function choose(value) {
  hapticTap()
  setTheme(value)
  open.value = false
}

// Закрити клавішею Escape. Натискання поза меню ловить прозорий фон (.backdrop),
// щоб випадково не відкрити термін під меню.
function onKeydown(event) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="theme-menu">
    <button
      type="button"
      class="theme-button"
      :aria-label="`Тема: ${currentLabel}`"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <template v-if="themeMode === 'light'">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
        </template>
        <path v-else-if="themeMode === 'dark'" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        <template v-else>
          <circle cx="12" cy="12" r="8.5" />
          <path class="filled" d="M12 3.5a8.5 8.5 0 0 1 0 17z" />
        </template>
      </svg>
    </button>

    <div v-if="open" class="backdrop" @click="open = false" />

    <Transition name="pop">
      <div v-if="open" class="menu" role="menu" aria-label="Тема">
        <button
          v-for="option in OPTIONS"
          :key="option.value"
          type="button"
          role="menuitemradio"
          class="item"
          :aria-checked="themeMode === option.value"
          @click="choose(option.value)"
        >
          <span>{{ option.label }}</span>
          <svg v-if="themeMode === option.value" class="check" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-menu {
  position: relative;
}

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

.theme-button .filled {
  fill: currentColor;
  stroke: none;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 29;
}

.menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 30;
  min-width: 200px;
  padding: 6px;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.item {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  border-radius: 10px;
  text-align: left;
  font-size: 16px;
}

.item[aria-checked='true'] {
  font-weight: 600;
}

.check {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.15s, transform 0.15s;
  transform-origin: top right;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
