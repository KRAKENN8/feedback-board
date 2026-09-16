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
      return true
    } catch (err) {
      error.value = err?.message || 'Registreerimine ebaõnnestus.'
      return false
    }
  }

  async function loginWithPassword(email, password) {
    error.value = ''
    try {
      await pb.collection('users').authWithPassword(email, password)
      return true
    } catch (err) {
      error.value = err?.message || 'Vale e-post või parool.'
      return false
    }
  }

  // Google and GitHub must be enabled in PocketBase users collection options.
  async function loginWithOAuth(provider) {
    error.value = ''
    try {
      const authMethods = await pb.collection('users').listAuthMethods()
      if (!authMethods?.oauth2?.providers?.some((item) => item.name === provider)) {
        throw new Error(
          `OAuth provider "${provider}" is not enabled for the users collection in PocketBase.`
        )
      }
      await pb.collection('users').authWithOAuth2({ provider })
      return true
    } catch (err) {
      error.value = err?.message || `${provider} sisselogimine ebaõnnestus.`
      return false
    }
  }

  function logout() {
    pb.authStore.clear()
  }

  return { user, error, registerWithPassword, loginWithPassword, loginWithOAuth, logout }
}
