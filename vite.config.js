import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Відносні шляхи: сайт працює за будь-якою адресою на GitHub Pages
  // (наприклад, https://name.github.io/termine-app/), назву репозиторію вписувати не треба.
  base: './',
})
