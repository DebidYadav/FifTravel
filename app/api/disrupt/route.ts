import { NextRequest, NextResponse } from 'next/server'
import { DisruptionRequest } from '@/lib/types'
import {
  mongoFindItinerary,
  mongoUpdateBooking,
  elasticGeoSearch,
  elasticTransitTelemetry,
  writeAgentMemory,
} from '@/lib/mcpClients'

/**
 * POST /api/disrupt
 *
 * World Cup Fan Disruption Recovery — server-side orchestration endpoint.
 *
 * Partner Track: Elastic Agent Builder + MongoDB Atlas — FIFA World Cup 2026
 *
 * ─── Production architecture ─────────────────────────────────────────────────
 *
 * 1. Gemini (via Google Cloud Agent Builder) acts as the reasoning LLM.
 *    Connect it to the Elastic MCP server from the Agent Builder Tools UI in
 *    Kibana. The Gemini agent sees all ES|QL-backed tools automatically.
 *
 *    Reference architecture:
 *    https://www.elastic.co/search-labs/blog/agent-builder-mcp-reference-architecture-elasticsearch
 *
 * 2. Replace the stub imports above with live MCP SDK calls:
 *
 *    import { Client } from '@modelcontextprotocol/sdk/client/index.js'
 *    import { StreamableHTTPClientTransport } from
 *      '@modelcontextprotocol/sdk/client/streamableHttp.js'
 *
 *    const elasticTransport = new StreamableHTTPClientTransport(
 *      new URL(process.env.ELASTIC_MCP_URL!),
 *      { requestInit: { headers: {
 *          Authorization: `ApiKey ${process.env.ELASTIC_API_KEY}`
 *      }}}
 *    )
 *    const elasticMCP = new Client({ name: 'fan-concierge', version: '1.0.0' })
 *    await elasticMCP.connect(elasticTransport)
 *
 * 3. Required environment variables (add to .env.local):
 *    ELASTIC_MCP_URL=https://<project>.es.us-central1.gcp.cloud.es.io/mcp
 *    ELASTIC_API_KEY=<your Elasticsearch API key>
 *    MONGO_URI=mongodb+srv://...
 *    GOOGLE_AI_API_KEY=<Gemini API key>
 *
 * ─── Agentic flow (6 steps) ──────────────────────────────────────────────────
 *  1. MongoDB MCP  → fan_itineraries.findOne         (fetch current bookings)
 *  2. Elastic MCP  → search_venues (ES|QL ST_DISTANCE, 5 km, shuttle)
 *  3. Elastic MCP  → transit_telemetry (ES|QL, latest vehicle snapshot)
 *  4. Elastic MCP  → search_venues (ES|QL ST_DISTANCE, 3 km, sports_bar)
 *  5. MongoDB MCP  → fan_bookings.updateOne ×2       (write new schedule)
 *  6. Elastic MCP  → write_agent_memory              (persist insight to index)
 *
 * ES|QL docs: https://www.elastic.co/docs/reference/query-languages/esql
 * Agent Builder: https://www.elastic.co/docs/solutions/search/agent-builder/get-started
 */
export async function POST(req: NextRequest) {
  let body: DisruptionRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { delayMinutes, city, airbnbCheckIn } = body

  if (!delayMinutes || !city) {
    return NextResponse.json(
      { error: 'Missing required fields: delayMinutes, city' },
      { status: 400 },
    )
  }

  // ── 1. MongoDB MCP — fetch itinerary ─────────────────────────────────────
  const itinerary = await mongoFindItinerary(city)

  // ── 2 & 4. Elastic MCP — parallel geo searches (ES|QL ST_DISTANCE) ───────
  const [shuttleOptions, barOptions] = await Promise.all([
    elasticGeoSearch(city, 'shuttle',    5, delayMinutes),
    elasticGeoSearch(city, 'sports_bar', 3),
  ])

  // ── 3. Elastic MCP — real-time transit telemetry ─────────────────────────
  const telemetry = await elasticTransitTelemetry(
    shuttleOptions[0]?.id ?? '',
    delayMinutes,
  )

  // ── 5. MongoDB MCP — update bookings ─────────────────────────────────────
  const baseCheckIn = airbnbCheckIn ?? itinerary.checkInTime
  const newCheckIn  = shiftTime(baseCheckIn, delayMinutes)

  const [shuttleResult, airbnbResult] = await Promise.all([
    mongoUpdateBooking(itinerary.shuttleBookingId, { departureTime: telemetry.nextSlot }),
    mongoUpdateBooking(itinerary.airbnbId,          { checkInTime:   newCheckIn }),
  ])

  // ── 6. Elastic Memory — persist enriched insight ─────────────────────────
  //   Writes agent output back to the wc2026_agent_memory Elasticsearch index.
  //   Future disruption queries can recall this via ELSER semantic search or
  //   ES|QL: FROM wc2026_agent_memory | WHERE userId=="fan-001" | SORT resolvedAt DESC
  const memResult = await writeAgentMemory({
    userId:       'fan-001',
    sessionId:    `api-${Date.now().toString(36)}`,
    city,
    event:         'disruption_recovery',
    delayMinutes,
    shuttleId:     shuttleOptions[0]?.id ?? '',
    barId:         barOptions[0]?.id ?? '',
    newCheckIn,
    resolvedAt:    new Date().toISOString(),
    summary:
      `Fan delayed ${delayMinutes} min in ${city}. `
      + `Shuttle rebooked to "${shuttleOptions[0]?.name}" @ ${telemetry.nextSlot}. `
      + `Sports bar: "${barOptions[0]?.name}". Airbnb check-in shifted to ${newCheckIn}.`,
  })

  return NextResponse.json({
    shuttle: {
      ...shuttleOptions[0],
      nextDeparture: telemetry.nextSlot,
    },
    sportsBar:        barOptions[0],
    newCheckInWindow: { start: newCheckIn, end: shiftTime(newCheckIn, 120) },
    estimatedExtraCost: 0,
    _meta: {
      mongoOps: {
        collection:    'fan_bookings',
        shuttleUpdate: shuttleResult,
        airbnbUpdate:  airbnbResult,
      },
      elasticOps: {
        venueIndex:       'wc2026_venues',
        telemetryIndex:   'wc2026_transit_telemetry',
        memoryIndex:      'wc2026_agent_memory',
        memoryDocId:       memResult._id,
        shuttleEsql:      `FROM wc2026_venues | WHERE type=="shuttle" AND city=="${city}" | EVAL dist_m=ST_DISTANCE(location,TO_GEOPOINT("POINT(...)")) | WHERE dist_m<=5000 | SORT dist_m ASC | LIMIT 5`,
        barEsql:          `FROM wc2026_venues | WHERE type=="sports_bar" AND city=="${city}" | EVAL dist_m=ST_DISTANCE(location,TO_GEOPOINT("POINT(...)")) | WHERE dist_m<=3000 | SORT rating DESC | LIMIT 5`,
        telemetry,
      },
    },
  })
}

function shiftTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total  = h * 60 + m + minutes
  const nh     = Math.floor(total / 60) % 24
  const nm     = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}
