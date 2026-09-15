import { createRouter, createWebHistory } from 'vue-router'
import { pb } from '../lib/pocketbase'

const routes = [
  { path: '/', name: 'board', component: () => import('../views/Board.vue') },
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'register', component: () => import('../views/Register.vue') },
  {
    path: '/minu',
    name: 'my-ideas',
    component: () => import('../views/MyIdeas.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pro',
    name: 'pro',
    component: () => import('../views/Pro.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !pb.authStore.isValid) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
