<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { pb } from '../lib/pocketbase'

const { user } = useAuth()
const route = useRoute()
const router = useRouter()

const waitingForWebhook = ref(false)
const paymentConfirmed = ref(false)
let pollTimer = null

async function refreshUser() {
  if (!user.value || !pb.authStore.token) return

  try {
    const freshUser = await pb.collection('users').getOne(user.value.id)
    pb.authStore.save(pb.authStore.token, freshUser)
  } catch (err) {
    console.error('Could not refresh the user profile.', err)
  }
}

// Poll until is_pro becomes true (webhook has been processed)
function startPolling() {
  waitingForWebhook.value = true
  let elapsed = 0
  const INTERVAL = 2000
  const MAX_WAIT = 30000

  pollTimer = setInterval(async () => {
    elapsed += INTERVAL
    await refreshUser()

    if (user.value?.is_pro) {
      clearInterval(pollTimer)
      pollTimer = null
      waitingForWebhook.value = false
      paymentConfirmed.value = true
    } else if (elapsed >= MAX_WAIT) {
      clearInterval(pollTimer)
      pollTimer = null
      waitingForWebhook.value = false
    }
  }, INTERVAL)
}

const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK
const hasValidPaymentLink = Boolean(
  STRIPE_PAYMENT_LINK &&
  STRIPE_PAYMENT_LINK.startsWith('https://buy.stripe.com/') &&
  !STRIPE_PAYMENT_LINK.includes('XXXXXXXX') &&
  !STRIPE_PAYMENT_LINK.includes('your_payment_link')
)

// Build the return URL pointing back to /pro?payment=success
const origin = typeof window !== 'undefined' ? window.location.origin : ''
const returnUrl = `${origin}/pro?payment=success`

const payUrl = hasValidPaymentLink
  ? `${STRIPE_PAYMENT_LINK}${STRIPE_PAYMENT_LINK.includes('?') ? '&' : '?'}client_reference_id=${encodeURIComponent(user.value?.id || '')}&redirect_url=${encodeURIComponent(returnUrl)}`
  : ''

onMounted(async () => {
  await refreshUser()

  // If user returns from Stripe with ?payment=success, start polling
  if (route.query.payment === 'success' && !user.value?.is_pro) {
    // Clean up the query parameter from the URL
    router.replace({ name: 'pro', query: {} })
    startPolling()
  } else if (route.query.payment === 'success' && user.value?.is_pro) {
    // Webhook already processed before redirect
    router.replace({ name: 'pro', query: {} })
    paymentConfirmed.value = true
  }
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <div class="auth-form" style="text-align:center">
    <h1>PRO konto</h1>

    <!-- Payment just confirmed -->
    <template v-if="paymentConfirmed || user?.is_pro">
      <p style="font-size:2rem; margin-bottom:0.5rem">✅</p>
      <p style="color: var(--pine); font-size:1.1rem; font-weight:600">
        Sul on PRO konto. Aitäh toetuse eest!
      </p>
      <p v-if="paymentConfirmed" style="color:#4a4a42; margin-top:0.5rem">
        Makse on edukalt kinnitatud. Sinu konto on nüüd uuendatud.
      </p>
    </template>

    <!-- Waiting for Stripe webhook to process -->
    <template v-else-if="waitingForWebhook">
      <p style="font-size:2rem; margin-bottom:0.5rem">⏳</p>
      <p style="color: var(--gold); font-size:1.05rem; font-weight:600">
        Makse töötlemine...
      </p>
      <p style="color:#4a4a42">
        Ootame Stripe'ilt kinnitust. See võtab paar sekundit.
      </p>
    </template>

    <!-- Not PRO yet, show purchase option -->
    <template v-else>
      <p v-if="!payUrl" class="form-error">
        Stripe Payment Link ei ole seadistatud.
      </p>
      <p style="color:#4a4a42">
        PRO kasutajad saavad märkida oma ideed prioriteetseks ja
        toetavad projekti arendust.
      </p>
      <a v-if="payUrl" :href="payUrl" class="btn-primary" style="display:block; text-decoration:none; box-sizing:border-box">
        Osta PRO (Stripe Test Mode)
      </a>
      <p style="font-size:0.8rem; color:#7a7a6e; margin-top:1rem">
        Testkaart: 4242 4242 4242 4242, mistahes tulevane kuupäev ja CVC.
      </p>
    </template>
  </div>
</template>
