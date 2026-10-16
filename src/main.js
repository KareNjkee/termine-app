import { createApp } from 'vue'
import App from './App.vue'
import { initTelegram } from './lib/telegram.js'
import './style.css'

initTelegram()
createApp(App).mount('#app')
