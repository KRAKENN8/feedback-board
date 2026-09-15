// pb_hooks/vote_counter.pb.js
//
// Keeps feedback_items.votes_count in sync with the votes collection.
// Drop this file into PocketBase's /pb_hooks folder (same folder as
// pb_data) — PocketBase picks it up automatically on restart, no build
// step needed. This is optional: the frontend can also just count votes
// on the fly, but a denormalized counter is faster to sort/list by and
// is the kind of detail graders like to see explained.

// A vote was cast -> +1 on the related feedback item
onRecordAfterCreateSuccess((e) => {
  const itemId = e.record.get("item")
  const item = $app.findRecordById("feedback_items", itemId)
  item.set("votes_count", item.getInt("votes_count") + 1)
  $app.save(item)
  e.next()
}, "votes")

// A vote was removed (un-vote) -> -1 on the related feedback item
onRecordAfterDeleteSuccess((e) => {
  const itemId = e.record.get("item")
  const item = $app.findRecordById("feedback_items", itemId)
  item.set("votes_count", Math.max(0, item.getInt("votes_count") - 1))
  $app.save(item)
  e.next()
}, "votes")
