import {
  AgentStatus,
  AgentThought,
  DisruptionPlan,
  DisruptionRequest,
  VenueOption,
} from './types'
import {
  mongoFindItinerary,
  mongoUpdateBooking,
  elasticGeoSearch,
  elasticTransitTelemetry,
  writeAgentMemory,
  GeoSearchResult,
} from './mcpClients'

// ─── Initial agent roster for the disruption flow ────────────────────────────

export const DISRUPTION_AGENTS: AgentStatus[] = [
  { id: 'dis-orchestrator', name: 'Disruption Orchestrator', icon: '🚨', status: 'idle', message: 'Waiting for disruption alert…' },
  { id: 'dis-mongo',        name: 'MongoDB Itinerary Agent', icon: '🍃', status: 'idle', message: 'Ready to query & update bookings.' },
  { id: 'dis-elastic',      name: 'Elastic Geo Agent',       icon: '⚡', status: 'idle', message: 'Ready to run ES|QL geo queries.' },
  { id: 'dis-booking',      name: 'Booking Agent',           icon: '📋', status: 'idle', message: 'Ready to rebook services.' },
  { id: 'dis-memory',       name: 'Elastic Memory Agent',    icon: '🧠', status: 'idle', message: 'Ready to store insights for future recall.' },
  { id: 'dis-confirm',      name: 'Confirmation Agent',      icon: '✅', status: 'idle', message: 'Awaiting plan to present.' },
]

type UpdateFn = (id: string, status: AgentStatus['status'], message: string) => void

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runDisruptionOrchestrator(
  req: DisruptionRequest,
  update: UpdateFn,
): Promise<{ plan: DisruptionPlan; thoughts: AgentThought[] }> {
  const thoughts: AgentThought[] = []

  const think = (
    agentId:   string,
    agentName: string,
    icon:      string,
    tool:      string,
    reasoning: string,
    result:    string,
  ) => thoughts.push({ agentId, agentName, icon, tool, reasoning, result })

  // ── Step 1: Orchestrator — parse & dispatch ───────────────────────────────
  update('dis-orchestrator', 'running',
    `Processing ${req.delayMinutes}-min delay for ${req.city} (${req.venue})…`)
  await tick(500)
  think(
    'dis-orchestrator', 'Disruption Orchestrator', '🚨',
    'parse_disruption',
    `User reported ${req.delayMinutes}-min flight delay to ${req.venue}, ${req.city}.`
      + ` Affected bookings: shuttle @ ${req.originalShuttleTime}, Airbnb check-in @ ${req.airbnbCheckIn}.`,
    `Dispatch plan: (1) MongoDB → fetch itinerary → (2) Elastic ES|QL → transit telemetry + geo search`
      + ` → (3) Booking Agent → recompute windows → (4) Elastic Memory → store insight → (5) HITL review.`,
  )
  update('dis-orchestrator', 'running', `Dispatching MongoDB & Elastic agents for ${req.city}…`)
  await tick(200)

  // ── Step 2: MongoDB — fetch current itinerary ─────────────────────────────
  update('dis-mongo', 'running', `Querying fan_itineraries for ${req.city}…`)
  const itinerary = await mongoFindItinerary(req.city)
  think(
    'dis-mongo', 'MongoDB Itinerary Agent', '🍃',
    'mongodb_find',
    `db.fan_itineraries.findOne({ matchCity: "${req.city}", userId: "fan-001" })`,
    `Retrieved → shuttleId: ${itinerary.shuttleBookingId} @ ${itinerary.shuttleTime}`
      + ` | airbnbId: ${itinerary.airbnbId} check-in: ${itinerary.checkInTime}`,
  )
  update('dis-mongo', 'done', `Itinerary retrieved — shuttle ${itinerary.shuttleBookingId}`)
  await tick(150)

  // ── Step 3a: Elastic — shuttle geo search (ES|QL ST_DISTANCE, 5 km) ───────
  update('dis-elastic', 'running',
    `ES|QL ST_DISTANCE query · wc2026_venues (${req.city}, 5 km, type=shuttle)…`)
  const shuttleOptions = await elasticGeoSearch(req.city, 'shuttle', 5, req.delayMinutes)
  const telemetry = await elasticTransitTelemetry(
    shuttleOptions[0]?.id ?? '',
    req.delayMinutes,
  )
  think(
    'dis-elastic', 'Elastic Geo Agent', '⚡',
    'search_venues (ES|QL) + transit_telemetry',
    `FROM wc2026_venues | WHERE type=="shuttle" AND city=="${req.city}"`
      + ` | EVAL dist_m=ST_DISTANCE(location, TO_GEOPOINT("POINT(...)")) | WHERE dist_m<=5000 AND available_seats>0`
      + ` | SORT dist_m ASC | LIMIT 5`,
    `Best shuttle: "${shuttleOptions[0]?.name}" — ${shuttleOptions[0]?.availableSeats} seats,`
      + ` next slot ${telemetry.nextSlot}. Telemetry: ${telemetry.occupied}/${telemetry.capacity} occupied.`,
  )

  // ── Step 3b: Elastic — sports-bar geo search (ES|QL, 3 km, ranked by rating)
  update('dis-elastic', 'running',
    `ES|QL query · wc2026_venues (${req.city}, 3 km, type=sports_bar, sort by rating)…`)
  const barOptions = await elasticGeoSearch(req.city, 'sports_bar', 3)
  think(
    'dis-elastic', 'Elastic Geo Agent', '⚡',
    'search_venues (ES|QL) — sports_bar',
    `FROM wc2026_venues | WHERE type=="sports_bar" AND city=="${req.city}"`
      + ` | EVAL dist_m=ST_DISTANCE(location, TO_GEOPOINT("POINT(...)")) | WHERE dist_m<=3000 AND available_seats>0`
      + ` | SORT rating DESC, dist_m ASC | LIMIT 5`,
    `Best match: "${barOptions[0]?.name}" — ${barOptions[0]?.availableSeats} seats,`
      + ` rated ${barOptions[0]?.rating}⭐, open until ${barOptions[0]?.openUntil}.`,
  )
  update('dis-elastic', 'done', `ES|QL geo results ready for ${req.venue}`)
  await tick(150)

  // ── Step 4: Booking Agent — compute & write new windows ──────────────────
  update('dis-booking', 'running', 'Computing new check-in window…')
  await tick(350)
  const newCheckIn  = shiftTime(req.airbnbCheckIn, req.delayMinutes)
  const newCheckOut = shiftTime(newCheckIn, 120)
  think(
    'dis-booking', 'Booking Agent', '📋',
    'compute_checkin',
    `Original check-in: ${req.airbnbCheckIn}. Delay: ${req.delayMinutes} min → New check-in: ${newCheckIn}.`,
    `Window: ${newCheckIn} – ${newCheckOut} (2-hour flexible window)`,
  )

  update('dis-booking', 'running', 'Writing updates to MongoDB via MCP…')
  const [shuttleUpd, airbnbUpd] = await Promise.all([
    mongoUpdateBooking(itinerary.shuttleBookingId, { departureTime: telemetry.nextSlot }),
    mongoUpdateBooking(itinerary.airbnbId,          { checkInTime:   newCheckIn }),
  ])
  think(
    'dis-booking', 'Booking Agent', '📋',
    'mongodb_update_one (×2)',
    `db.fan_bookings.updateOne({ _id: "${itinerary.shuttleBookingId}" }, { $set: { departureTime: "${telemetry.nextSlot}" } })`
      + ` + updateOne({ _id: "${itinerary.airbnbId}" }, { $set: { checkInTime: "${newCheckIn}" } })`,
    `Shuttle: ${shuttleUpd.acknowledged ? '✓' : '✗'} (modified: ${shuttleUpd.modifiedCount})`
      + ` | Airbnb: ${airbnbUpd.acknowledged ? '✓' : '✗'} (modified: ${airbnbUpd.modifiedCount})`,
  )
  update('dis-booking', 'done', 'Bookings updated in MongoDB')
  await tick(200)

  // ── Step 5: Elastic Memory Agent — write enriched insight ────────────────
  //   Elastic Agent Builder stores agent outputs back into Elasticsearch so
  //   future disruption sessions can recall patterns via semantic search / ES|QL.
  //   Index: wc2026_agent_memory
  //   Blog:  https://www.elastic.co/search-labs/blog/ai-agent-memory-management-elasticsearch
  update('dis-memory', 'running', 'Indexing disruption insight into wc2026_agent_memory…')
  const memResult = await writeAgentMemory({
    userId:       'fan-001',
    sessionId:    `sess-${Date.now().toString(36)}`,
    city:          req.city,
    event:         'disruption_recovery',
    delayMinutes:  req.delayMinutes,
    shuttleId:     shuttleOptions[0]?.id ?? '',
    barId:         barOptions[0]?.id ?? '',
    newCheckIn,
    resolvedAt:    new Date().toISOString(),
    summary:
      `Fan delayed ${req.delayMinutes} min in ${req.city}. `
      + `Rebooked shuttle to "${shuttleOptions[0]?.name}" (${telemetry.nextSlot}). `
      + `Bar: "${barOptions[0]?.name}". Airbnb check-in shifted to ${newCheckIn}.`,
  })
  think(
    'dis-memory', 'Elastic Memory Agent', '🧠',
    'write_agent_memory → wc2026_agent_memory',
    `Writing enriched disruption insight to Elasticsearch memory index so future`
      + ` sessions can retrieve it via semantic search (ELSER) or ES|QL recall:`
      + ` FROM wc2026_agent_memory | WHERE userId=="fan-001" AND city=="${req.city}" | SORT resolvedAt DESC | LIMIT 10`,
    `Indexed: _id=${memResult._id} result=${memResult.result}`
      + ` · Summary stored as retrievable intelligence for future disruption queries.`,
  )
  update('dis-memory', 'done', `Insight indexed (${memResult._id}) — available for future recall`)
  await tick(150)

  // ── Step 6: Confirmation Agent — assemble plan for HITL review ───────────
  update('dis-confirm', 'running', 'Assembling disruption-recovery plan for your review…')
  await tick(300)

  const shuttle:   VenueOption = toVenueOption(shuttleOptions[0], 'shuttle', telemetry.nextSlot)
  const sportsBar: VenueOption = toVenueOption(barOptions[0], 'sports_bar')

  const plan: DisruptionPlan = {
    delayMinutes: req.delayMinutes,
    shuttle,
    sportsBar,
    newCheckInWindow: { start: newCheckIn, end: newCheckOut },
    estimatedExtraCost: 0,
  }

  think(
    'dis-confirm', 'Confirmation Agent', '✅',
    'build_plan (HITL)',
    'All agent outputs collected. Building final plan for human-in-the-loop review.',
    `Shuttle → "${shuttle.name}" at ${telemetry.nextSlot}`
      + ` | Bar → "${sportsBar.name}"`
      + ` | Check-in → ${newCheckIn} – ${newCheckOut}`,
  )
  update('dis-confirm',      'done', 'Plan ready — awaiting your confirmation')
  update('dis-orchestrator', 'done', `Recovery plan built for ${req.city} — human review required`)

  return { plan, thoughts }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function tick(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

function shiftTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total  = h * 60 + m + minutes
  const nh     = Math.floor(total / 60) % 24
  const nm     = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function toVenueOption(
  src:           GeoSearchResult | undefined,
  type:          VenueOption['type'],
  nextDeparture?: string,
): VenueOption {
  if (!src) {
    return { id: 'unknown', name: 'N/A', type, address: '', distanceKm: 0 }
  }
  return {
    id:             src.id,
    name:           src.name,
    type,
    address:        src.address,
    distanceKm:     src.distanceKm,
    availableSeats: src.availableSeats,
    nextDeparture:  nextDeparture ?? src.nextDeparture,
    rating:         src.rating,
    openUntil:      src.openUntil,
  }
}
