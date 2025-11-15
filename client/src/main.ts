import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Dialog, Notify, Loading } from 'quasar'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/dist/quasar.css'

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
    brand: {
      primary: '#1976d2',
      secondary: '#26A69A',
      accent: '#9C27B0',
      dark: '#1d1d1d',
      positive: '#21BA45',
      negative: '#C10015',
      info: '#31CCEC',
      warning: '#F2C037'
    }
  }
})

app.mount('#app')
