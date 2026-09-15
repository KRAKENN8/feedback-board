<script setup>
import { useAuth } from './composables/useAuth'
import { useRouter } from 'vue-router'

const { user, logout } = useAuth()
const router = useRouter()

function handleLogout() {
  logout()
  router.push({ name: 'board' })
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <router-link to="/" class="brand">Idee<span class="brand-mark">laud</span></router-link>
      <nav class="nav-links">
        <router-link to="/">Ideed</router-link>
        <router-link v-if="user" to="/minu">Minu hääled</router-link>
        <router-link v-if="user" to="/pro">{{ user.is_pro ? 'PRO ✓' : 'PRO' }}</router-link>
        <router-link v-if="!user" to="/login">Logi sisse</router-link>
        <button v-else class="btn-link" @click="handleLogout">Logi välja ({{ user.name || user.email }})</button>
      </nav>
    </div>
  </header>
  <main class="container">
    <router-view />
  </main>
</template>
