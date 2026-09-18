<script setup>
import { onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { pb } from '../lib/pocketbase'

const { user } = useAuth()

async function refreshUser() {
  if (!user.value || !pb.authStore.token) return

  try {
    const freshUser = await pb.collection('users').getOne(user.value.id)
    pb.authStore.save(pb.authStore.token, freshUser)
  } catch (err) {
    console.error('Could not refresh the user profile.', err)
  }
}

const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK
const hasValidPaymentLink = Boolean(
  STRIPE_PAYMENT_LINK &&
  STRIPE_PAYMENT_LINK.startsWith('https://buy.stripe.com/') &&
  !STRIPE_PAYMENT_LINK.includes('XXXXXXXX') &&
  !STRIPE_PAYMENT_LINK.includes('your_payment_link')
)

const payUrl = hasValidPaymentLink
  ? `${STRIPE_PAYMENT_LINK}${STRIPE_PAYMENT_LINK.includes('?') ? '&' : '?'}client_reference_id=${encodeURIComponent(user.value?.id || '')}`
  : ''

onMounted(refreshUser)
</script>

<template>
  <div class="auth-form" style="text-align:center">
    <h1>PRO konto</h1>
    <p v-if="user?.is_pro" style="color: var(--pine)">
      Sul on juba PRO konto. Aitäh toetuse eest!
    </p>
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
        Staatus uueneb paari sekundi jooksul pärast makset (Stripe webhook).
      </p>
    </template>
  </div>
</template>
