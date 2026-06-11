const DEFAULTS = {
  orchestrator: process.env.ORCHESTRATOR_URL || 'http://localhost:3000/api/plan',
  elastic: process.env.NEXT_PUBLIC_ELASTIC_MCP_URL || 'http://localhost:4000',
  mongo: process.env.NEXT_PUBLIC_MONGO_MCP_URL || 'http://localhost:4000',
}

async function postJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch (e) { json = text }
  return { ok: res.ok, status: res.status, body: json }
}

async function main() {
  console.log('Using endpoints:', DEFAULTS)

  console.log('\n1) Testing orchestrator / plan endpoint')
  const planResp = await postJson(DEFAULTS.orchestrator, { team: 'Argentina', budget: 3000, startCity: 'New York', stages: ['Group Stage'], nationality: 'United States' })
  console.log(' -> status', planResp.status)
  if (!planResp.ok) { console.error('Orchestrator test failed', planResp.body); process.exit(1) }

  console.log('\n2) Testing elastic search_venues')
  const searchResp = await postJson(`${DEFAULTS.elastic.replace(/\/$/,'')}/search_venues`, { city: 'New York', type: 'shuttle' })
  console.log(' -> status', searchResp.status)
  if (!searchResp.ok) { console.error('Elastic search test failed', searchResp.body); process.exit(1) }

  console.log('\n3) Testing mongo mongodb_find')
  const mongoResp = await postJson(`${DEFAULTS.mongo.replace(/\/$/,'')}/mongodb_find`, { city: 'New York' })
  console.log(' -> status', mongoResp.status)
  if (!mongoResp.ok) { console.error('Mongo find test failed', mongoResp.body); process.exit(1) }

  console.log('\nSmoke tests passed')
}

main().catch(err => { console.error(err); process.exit(1) })
