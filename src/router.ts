import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import GameView from './views/GameView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'game',
    component: GameView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
