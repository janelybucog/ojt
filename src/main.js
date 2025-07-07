// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import { QrcodeStream } from 'vue-qrcode-reader'

const app = createApp(App)
app.component('QrcodeStream', QrcodeStream) // ✅ Register globally
app.mount('#app')
