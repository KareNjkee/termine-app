<script setup>
import { computed } from 'vue'
import { MONTHS } from '../lib/dates.js'
import { SEASONS, seasonOf } from '../lib/season.js'

// Смуга над календарем: пора року, великий місяць, стрілки і живі мотиви
// (листя восени, сніг узимку, цвіт навесні, сонце з іскрами влітку)
const props = defineProps({
  year: { type: Number, required: true },
  month: { type: Number, required: true }, // 0–11
})
const emit = defineEmits(['prev', 'next'])

const season = computed(() => seasonOf(props.month))
const meta = computed(() => SEASONS[season.value])

// Розкладка мотивів фіксована, щоб вони не стрибали при кожному оновленні
const motifs = Array.from({ length: 10 }, (_, i) => {
  const duration = 9 + (i % 4) * 2.5
  return {
    key: i,
    tone: `tone-${(i % 3) + 1}`,
    style: {
      left: `${(((i * 37 + 11) % 330) / 330) * 94}%`,
      width: `${14 + (i % 3) * 6}px`,
      height: `${14 + (i % 3) * 6}px`,
      animationDuration: `${duration}s`,
      animationDelay: `${-((i * 1.9) % duration).toFixed(1)}s`,
      '--rest-top': `${8 + ((i * 23) % 100)}px`,
      '--spark-top': `${16 + ((i * 29) % 96)}px`,
    },
  }
})
</script>

<template>
  <div class="band" :class="`motif-${meta.motif}`">
    <div :key="season" class="motifs" aria-hidden="true">
      <svg v-if="meta.motif === 'sun'" class="sun" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="26" />
        <g class="rays">
          <line x1="60" y1="6" x2="60" y2="22" /><line x1="60" y1="98" x2="60" y2="114" />
          <line x1="6" y1="60" x2="22" y2="60" /><line x1="98" y1="60" x2="114" y2="60" />
          <line x1="22" y1="22" x2="33" y2="33" /><line x1="87" y1="87" x2="98" y2="98" />
          <line x1="22" y1="98" x2="33" y2="87" /><line x1="87" y1="33" x2="98" y2="22" />
        </g>
      </svg>

      <span v-for="m in motifs" :key="m.key" class="motif" :class="m.tone" :style="m.style">
        <svg v-if="meta.motif === 'leaf'" viewBox="0 0 24 24">
          <path class="fill" d="M12 2C7 6 4.5 11 6 16.5c1.2 4 6.5 5 10 1.5C19.5 13 18 7 12 2z" />
          <path class="vein" d="M12 6v15" />
        </svg>
        <svg v-else-if="meta.motif === 'snow'" viewBox="0 0 24 24">
          <g class="flake">
            <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
            <path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5" />
          </g>
        </svg>
        <svg v-else-if="meta.motif === 'blossom'" viewBox="0 0 24 24">
          <g class="fill">
            <circle cx="12" cy="6.5" r="4" /><circle cx="17.3" cy="10.4" r="4" /><circle cx="15.3" cy="16.7" r="4" />
            <circle cx="8.7" cy="16.7" r="4" /><circle cx="6.7" cy="10.4" r="4" />
          </g>
          <circle class="core" cx="12" cy="12" r="2.6" />
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <path class="fill" d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
        </svg>
      </span>
    </div>

    <div class="body">
      <div class="title" aria-live="polite">
        <span class="season tabular">{{ meta.name }} {{ year }}</span>
        <Transition name="month" mode="out-in">
          <h2 :key="`${year}-${month}`" class="month">{{ MONTHS[month] }}</h2>
        </Transition>
      </div>
      <div class="nav">
        <button type="button" aria-label="Попередній місяць" @click="emit('prev')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button type="button" aria-label="Наступний місяць" @click="emit('next')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.band {
  position: relative;
  height: 140px;
  border-radius: 22px;
  overflow: hidden;
  background: var(--band, var(--fill));
  transition: background-color 0.4s ease;
}

.motifs {
  position: absolute;
  inset: 0;
  opacity: 0.8;
  pointer-events: none;
}

.motif {
  position: absolute;
  top: 0;
  animation: fall linear infinite;
  will-change: transform;
}

.motif svg {
  display: block;
  width: 100%;
  height: 100%;
}

.tone-1 { color: var(--motif-1); }
.tone-2 { color: var(--motif-2); }
.tone-3 { color: var(--motif-3); }

.fill { fill: currentColor; }
.vein { fill: none; stroke: var(--band); stroke-width: 1.4; stroke-linecap: round; }
.core { fill: var(--band); }
.flake { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }

/* Літо: іскри мерехтять на місці, сонце повільно обертається */
.motif-sun .motif {
  top: var(--spark-top);
  animation-name: twinkle;
  animation-timing-function: ease-in-out;
}

.sun {
  position: absolute;
  right: -34px;
  top: -34px;
  width: 150px;
  height: 150px;
  fill: var(--motif-1);
  animation: spin 60s linear infinite;
}

.sun circle { opacity: 0.75; }
.sun .rays { stroke: var(--motif-1); stroke-width: 4; stroke-linecap: round; opacity: 0.55; }

@keyframes fall {
  0% { transform: translateY(-30px) rotate(0deg); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translateY(170px) rotate(220deg); opacity: 0; }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.25; transform: scale(0.75); }
  50% { opacity: 1; transform: scale(1.1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Без анімацій (налаштування системи): мотиви просто лежать на смузі */
@media (prefers-reduced-motion: reduce) {
  .motif,
  .sun {
    animation: none !important;
  }
  .motif {
    top: var(--rest-top);
  }
  .motif-sun .motif {
    top: var(--spark-top);
  }
}

.body {
  position: relative;
  height: 100%;
  padding: 16px 12px 16px 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.title {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.season {
  font-size: 14px;
  font-weight: 600;
  color: var(--band-label, var(--accent));
}

.month {
  margin: 0;
  font-size: clamp(30px, 10vw, 44px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}

.nav {
  flex: none;
  display: flex;
  gap: 6px;
}

.nav button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--bg);
  color: var(--text);
}

.nav svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.month-enter-active,
.month-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.month-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.month-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
