import { ref } from 'vue'
import { pb } from '../lib/pocketbase'

// Reactive mirror of PocketBase's own auth store, so every component
// that imports useAuth() reacts to login/logout instantly.
const user = ref(pb.authStore.record)

pb.authStore.onChange(() => {
  user.value = pb.authStore.record
})

export function useAuth() {
  const error = ref('')

  async function registerWithPassword(email, password, name) {
    error.value = ''
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      })
      await pb.collection('users').authWithPassword(email, password)
    } catch (err) {
      error.value = err?.message || 'Registreerimine ebaõnnestus.'
      throw err
    }
  }

  async function loginWithPassword(email, password) {
    error.value = ''
    try {
      await pb.collection('users').authWithPassword(email, password)
    } catch (err) {
      error.value = err?.message || 'Vale e-post või parool.'
      throw err
    }
  }

  // Works for any OAuth2 provider enabled in the PocketBase admin UI
  // (Settings -> Auth providers). We only wire up Google and GitHub
  // in the UI, but the function itself is provider-agnostic.
  async function loginWithOAuth(provider) {
    error.value = ''
    try {
      await pb.collection('users').authWithOAuth2({ provider })
    } catch (err) {
      error.value = err?.message || `${provider} sisselogimine ebaõnnestus.`
      throw err
    }
  }

  function logout() {
    pb.authStore.clear()
  }

  return { user, error, registerWithPassword, loginWithPassword, loginWithOAuth, logout }
}
