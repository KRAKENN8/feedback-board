<script setup>
import { useAuth } from '../composables/useAuth'

const { user } = useAuth()

// Replace with your own Stripe Test Mode Payment Link.
// client_reference_id lets the /webhooks/stripe hook know which
// PocketBase user just paid.
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_XXXXXXXXXXXX'

const payUrl = `${STRIPE_PAYMENT_LINK}?client_reference_id=${user.value?.id}`
</script>

<template>
  <div class="auth-form" style="text-align:center">
    <h1>PRO konto</h1>
    <p v-if="user?.is_pro" style="color: var(--pine)">
      Sul on juba PRO konto. Aitäh toetuse eest!
    </p>
    <template v-else>
      <p style="color:#4a4a42">
        PRO kasutajad saavad märkida oma ideed prioriteetseks ja
        toetavad projekti arendust.
      </p>
      <a :href="payUrl" class="btn-primary" style="display:block; text-decoration:none; box-sizing:border-box">
        Osta PRO (Stripe Test Mode)
      </a>
      <p style="font-size:0.8rem; color:#7a7a6e; margin-top:1rem">
        Testkaart: 4242 4242 4242 4242, mistahes tulevane kuupäev ja CVC.
        Staatus uueneb paari sekundi jooksul pärast makset (Stripe webhook).
      </p>
    </template>
  </div>
</template>
