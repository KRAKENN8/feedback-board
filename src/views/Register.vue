<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const name = ref('')
const email = ref('')
const password = ref('')
const { error, registerWithPassword, loginWithOAuth } = useAuth()
const router = useRouter()

async function handleSubmit() {
  await registerWithPassword(email.value, password.value, name.value)
  if (!error.value) router.push({ name: 'board' })
}

async function handleOAuth(provider) {
  await loginWithOAuth(provider)
  if (!error.value) router.push({ name: 'board' })
}
</script>

<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <h1>Loo konto</h1>

    <label for="name">Nimi</label>
    <input id="name" v-model="name" type="text" required autocomplete="name" />

    <label for="email">E-post</label>
    <input id="email" v-model="email" type="email" required autocomplete="email" />

    <label for="password">Parool (vähemalt 8 märki)</label>
    <input id="password" v-model="password" type="password" required minlength="8" autocomplete="new-password" />

    <button class="btn-primary" type="submit">Registreeru</button>

    <div class="divider">või</div>
    <div class="oauth-row">
      <button type="button" class="btn-oauth" @click="handleOAuth('google')">Google</button>
      <button type="button" class="btn-oauth" @click="handleOAuth('github')">GitHub</button>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>
    <p class="swap-link">On juba konto? <router-link to="/login">Logi sisse</router-link></p>
  </form>
</template>
