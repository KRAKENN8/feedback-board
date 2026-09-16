<script setup>
import { ref, onMounted, watch } from 'vue'
import { pb } from '../lib/pocketbase'
import { useAuth } from '../composables/useAuth'

const { user } = useAuth()

const items = ref([])
const myVoteIds = ref({}) // { [feedback_item_id]: vote_record_id }
const loading = ref(true)
const loadError = ref('')

const newTitle = ref('')
const newDescription = ref('')
const submitting = ref(false)
const submitError = ref('')
const voteError = ref('')

async function loadBoard() {
  loading.value = true
  loadError.value = ''
  try {
    items.value = await pb.collection('feedback_items').getFullList({
      sort: '-votes_count,-created',
      expand: 'author',
    })

    if (user.value) {
      const votes = await pb.collection('votes').getFullList({
        filter: `user = "${user.value.id}"`,
      })
      myVoteIds.value = Object.fromEntries(votes.map((v) => [v.item, v.id]))
    } else {
      myVoteIds.value = {}
    }
  } catch (err) {
    const status = err?.status ? ` (${err.status})` : ''
    const detail = err?.response?.message || err?.message || 'Tundmatu viga'
    loadError.value = `Ideid ei õnnestunud laadida${status}: ${detail}`
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function toggleVote(item) {
  if (!user.value) return

  const existingVoteId = myVoteIds.value[item.id]
  voteError.value = ''
  try {
    if (existingVoteId) {
      await pb.collection('votes').delete(existingVoteId)
    } else {
      await pb.collection('votes').create({
        item: item.id,
        user: user.value.id,
      })
    }

    const currentItem = await pb.collection('feedback_items').getOne(item.id)
    const nextVotesCount = Math.max(
      0,
      currentItem.votes_count + (existingVoteId ? -1 : 1)
    )
    await pb.collection('feedback_items').update(item.id, {
      votes_count: nextVotesCount,
    })
    await loadBoard()
  } catch (err) {
    const detail = err?.response?.message || err?.message || 'Tundmatu viga'
    voteError.value = `Hääletamine ebaõnnestus: ${detail}`
    console.error(err)
  }
}

async function submitIdea() {
  submitError.value = ''
  if (!newTitle.value.trim()) {
    submitError.value = 'Kirjuta ideele pealkiri.'
    return
  }
  submitting.value = true
  try {
    const created = await pb.collection('feedback_items').create({
      title: newTitle.value.trim(),
      description: newDescription.value.trim(),
      author: user.value.id,
      votes_count: 0,
    })
    created.expand = { author: user.value }
    items.value.unshift(created)
    newTitle.value = ''
    newDescription.value = ''
  } catch (err) {
    submitError.value = 'Idee lisamine ebaõnnestus.'
    console.error(err)
  } finally {
    submitting.value = false
  }
}

onMounted(loadBoard)

watch(user, () => {
  loadBoard()
})
</script>

<template>
  <h1 style="margin: 1.75rem 0 0.25rem">Ideed ja ettepanekud</h1>
  <p style="color:#7a7a6e; margin-top:0.2rem">
    Paku uus idee või hääleta olemasolevate poolt. Kõige rohkem hääli kogunud ideed tõusevad üles.
  </p>

  <section v-if="user" class="new-idea">
    <label for="title">Pealkiri</label>
    <input id="title" v-model="newTitle" type="text" placeholder="Nt: Tumeda tausta valik" maxlength="120" />
    <label for="desc">Kirjeldus (valikuline)</label>
    <textarea id="desc" v-model="newDescription" rows="3" placeholder="Selgita lühidalt, mida see ettepanek lahendaks..."></textarea>
    <button class="btn-primary" style="width:auto; padding:0.55rem 1.2rem; margin-top:0.9rem" :disabled="submitting" @click="submitIdea">
      {{ submitting ? 'Saadan...' : 'Lisa idee' }}
    </button>
    <p v-if="submitError" class="form-error">{{ submitError }}</p>
  </section>
  <section v-else class="new-idea">
    <p style="margin:0">
      <router-link to="/login">Logi sisse</router-link> et pakkuda uus idee ja hääletada.
    </p>
  </section>

  <p v-if="loadError" class="form-error">{{ loadError }}</p>
  <p v-if="voteError" class="form-error">{{ voteError }}</p>
  <p v-else-if="loading" class="empty-state">Laen ideid...</p>

  <div v-else class="ballot">
    <p v-if="items.length === 0" class="empty-state">Veel pole ühtegi ideed — ole esimene!</p>

    <div v-for="item in items" :key="item.id" class="ballot-row">
      <div class="tally" :class="{ voted: !!user && !!myVoteIds[item.id] }">
        <span class="tally-count">{{ item.votes_count }}</span>
        <button
          class="tally-arrow"
          :disabled="!user"
          :title="user ? (myVoteIds[item.id] ? 'Võta hääl tagasi' : 'Anna hääl') : 'Logi sisse, et hääletada'"
          @click="toggleVote(item)"
        >
          {{ !user ? '▲ logi sisse' : (myVoteIds[item.id] ? '▼ tagasi' : '▲ hääleta') }}
        </button>
      </div>
      <div>
        <p class="idea-title">{{ item.title }}</p>
        <p v-if="item.description" class="idea-desc">{{ item.description }}</p>
        <p class="idea-meta">{{ item.expand?.author?.name || item.expand?.author?.email || 'Kasutaja' }}</p>
      </div>
    </div>
  </div>
</template>
