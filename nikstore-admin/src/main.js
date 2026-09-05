import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupGuard } from './router/guard'
import { setupRouteLoading } from './composables/useRouteLoading'
import './assets/styles/main.css'

setupGuard(router)
setupRouteLoading(router)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
