// Simple smoke test: GET top scores, POST a test score, then GET again to confirm.
// Usage: node scripts/smoke-test.js

const BASE = process.env.VITE_API_BASE_URL || 'http://localhost:4000'
const fetch = global.fetch || require('node-fetch')

async function run() {
  console.log('Using API base:', BASE)

  const topUrl = `${BASE.replace(/\/$/, '')}/scores?_sort=score&_order=desc&_limit=10`
  console.log('\nGET top scores ->', topUrl)
  const before = await (await fetch(topUrl)).json()
  console.log('Top scores (before):', before.slice(0,5))

  const testScore = {
    name: 'smoke-test',
    score: Math.floor(Math.random() * 10000),
    timestamp: new Date().toISOString()
  }

  console.log('\nPOST test score ->', testScore)
  const postRes = await fetch(`${BASE.replace(/\/$/, '')}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testScore)
  })
  const postBody = await postRes.json()
  console.log('POST status:', postRes.status)
  console.log('POST response:', postBody)

  console.log('\nGET top scores (after)')
  const after = await (await fetch(topUrl)).json()
  console.log('Top scores (after):', after.slice(0,5))

  const found = after.find(s => (s.name === testScore.name && s.score === testScore.score))
  if (found) {
    console.log('\nSmoke test PASSED — posted score is present in leaderboard (id=' + found.id + ')')
    process.exit(0)
  } else {
    console.error('\nSmoke test FAILED — posted score not found in leaderboard')
    process.exit(2)
  }
}

run().catch(err => { console.error(err); process.exit(3) })
