<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const email = ref('')
const password = ref('')
const { error, loginWithPassword, loginWithOAuth } = useAuth()
const router = useRouter()
const route = useRoute()

async function handleSubmit() {
  await loginWithPassword(email.value, password.value)
  if (!error.value) router.push(route.query.redirect || { name: 'board' })
}

async function handleOAuth(provider) {
  await loginWithOAuth(provider)
  if (!error.value) router.push(route.query.redirect || { name: 'board' })
}
</script>

<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <h1>Logi sisse</h1>

    <label for="email">E-post</label>
    <input id="email" v-model="email" type="email" required autocomplete="email" />

    <label for="password">Parool</label>
    <input id="password" v-model="password" type="password" required autocomplete="current-password" />

    <button class="btn-primary" type="submit">Logi sisse</button>

    <div class="divider">või</div>
    <div class="oauth-row">
      <button type="button" class="btn-oauth" @click="handleOAuth('google')">Google</button>
      <button type="button" class="btn-oauth" @click="handleOAuth('github')">GitHub</button>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>
    <p class="swap-link">Pole veel kontot? <router-link to="/register">Registreeru</router-link></p>
  </form>
</template>
