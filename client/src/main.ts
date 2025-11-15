import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Dialog, Notify, Loading } from 'quasar'

// Import Quasar css
import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'

import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(Quasar, {
  plugins: {
    Dialog,
    Notify,
    Loading
  },
  config: {
    dark: true
  }
})

app.mount('#app')
