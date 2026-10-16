import { createApp } from 'vue'
import App from './App.vue'
import { initTelegram } from '../../../Downloads/update-theme/update-theme/src/lib/telegram.js'
import { initTheme } from '../../../Downloads/update-theme/update-theme/src/lib/theme.js'
import './style.css'

initTelegram()
initTheme()
createApp(App).mount('#app')
