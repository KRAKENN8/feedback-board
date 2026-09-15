<script setup>
import { ref, onMounted } from 'vue'
import { pb } from '../lib/pocketbase'
import { useAuth } from '../composables/useAuth'

const { user } = useAuth()
const votedItems = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  const votes = await pb.collection('votes').getFullList({
    filter: `user = "${user.value.id}"`,
    expand: 'item',
    sort: '-created',
  })
  votedItems.value = votes.map((v) => v.expand?.item).filter(Boolean)
  loading.value = false
}

onMounted(load)
</script>

<template>
  <h1 style="margin: 1.75rem 0 0.25rem">Minu hääled</h1>
  <p style="color:#7a7a6e; margin-top:0.2rem">Ideed, mille poolt oled hääletanud.</p>

  <p v-if="loading" class="empty-state">Laen...</p>
  <div v-else class="ballot">
    <p v-if="votedItems.length === 0" class="empty-state">Sa pole veel ühegi idee poolt hääletanud.</p>
    <div v-for="item in votedItems" :key="item.id" class="ballot-row">
      <div class="tally voted">
        <span class="tally-count">{{ item.votes_count }}</span>
      </div>
      <div>
        <p class="idea-title">{{ item.title }}</p>
        <p v-if="item.description" class="idea-desc">{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>
