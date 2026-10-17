import { createApp } from 'vue'
import App from './App.vue'
import { initTelegram } from './lib/telegram.js'
import { initTheme } from './lib/theme.js'
import './style.css'

initTelegram()
initTheme()
createApp(App).mount('#app')
