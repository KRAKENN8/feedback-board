import PocketBase from 'pocketbase'

// Never hardcode the URL — always read it from the env var, so the
// same build can point at a local PocketBase during development and
// at the Coolify-hosted one in production.
const url = import.meta.env.VITE_POCKETBASE_URL

if (!url) {
  console.warn(
    'VITE_POCKETBASE_URL is not set — copy .env.example to .env and fill it in.'
  )
}

export const pb = new PocketBase(url)

// Persist the auth store across page reloads (PocketBase does this via
// localStorage by default, this just makes the behaviour explicit).
pb.autoCancellation(false)
