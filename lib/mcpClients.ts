/**
 * MCP Client Layer — Elastic Agent Builder + MongoDB Atlas
 *
 * Partner Track: Elastic + MongoDB — FIFA World Cup 2026
 *
 * ─── How to go live with Elastic Agent Builder ───────────────────────────────
 *
 * 1. Create a Serverless Elasticsearch project on cloud.elastic.co
 * 2. Enable Agent Builder in Kibana → define tools backed by ES|QL queries
 *    (each tool is exposed over the built-in MCP server — no extra config needed)
 * 3. Replace the stub bodies below with live MCP SDK calls:
 *
 *   import { Client } from '@modelcontextprotocol/sdk/client/index.js'
 *   import { StreamableHTTPClientTransport } from
 *     '@modelcontextprotocol/sdk/client/streamableHttp.js'
 *
 *   const transport = new StreamableHTTPClientTransport(
 *     new URL(process.env.ELASTIC_MCP_URL!),
 *     { requestInit: { headers: {
 *         Authorization: `ApiKey ${process.env.ELASTIC_API_KEY}`
 *     }}}
 *   )
 *   const elasticMCP = new Client({ name: 'fan-concierge', version: '1.0.0' })
 *   await elasticMCP.connect(transport)
 *
 *   // Then call any Agent Builder tool by name:
 *   const result = await elasticMCP.callTool({ name: 'search_shuttles', arguments: { ... } })
 *
 * Each function below documents the ES|QL query powering its Agent Builder tool.
 *
 * Docs: https://www.elastic.co/docs/solutions/search/agent-builder/get-started
 *       https://www.elastic.co/docs/solutions/search/agent-builder/mcp-server
 */

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

// Live MCP endpoints can be provided via NEXT_PUBLIC_* env vars for client usage
const ELASTIC_MCP_URL = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ELASTIC_MCP_URL : undefined
const MONGO_MCP_URL = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MONGO_MCP_URL : undefined

async function postJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed ${res.status}`)
  return res.json()
}

// ─── Geo Coordinates (used inside ES|QL ST_DISTANCE) ─────────────────────────

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'New York':      { lat: 40.8135,  lon: -74.0736  },
  'Los Angeles':   { lat: 33.9534,  lon: -118.3392 },
  'Miami':         { lat: 25.9580,  lon: -80.2389  },
  'Dallas':        { lat: 32.7480,  lon: -97.0930  },
  'Houston':       { lat: 29.6847,  lon: -95.4107  },
  'Chicago':       { lat: 41.8623,  lon: -87.6167  },
  'Mexico City':   { lat: 19.3030,  lon: -99.1500  },
  'Toronto':       { lat: 43.6333,  lon: -79.4167  },
  'Vancouver':     { lat: 49.2769,  lon: -123.1108 },
  'San Francisco': { lat: 37.4032,  lon: -121.9694 },
  'Kansas City':   { lat: 39.0489,  lon: -94.4839  },
  'Seattle':       { lat: 47.5952,  lon: -122.3316 },
  'Guadalajara':   { lat: 20.6494,  lon: -103.4025 },
}

const VENUE_MAP: Record<string, string> = {
  'New York':      'MetLife Stadium',
  'Los Angeles':   'SoFi Stadium',
  'Miami':         'Hard Rock Stadium',
  'Dallas':        'AT&T Stadium',
  'Houston':       'NRG Stadium',
  'Chicago':       'Soldier Field',
  'Mexico City':   'Estadio Azteca',
  'Toronto':       'BMO Field',
  'Vancouver':     'BC Place',
  'San Francisco': "Levi's Stadium",
  'Kansas City':   'Arrowhead Stadium',
  'Seattle':       'Lumen Field',
  'Guadalajara':   'Estadio Akron',
}

// ─── Static Venue Fixture Data ────────────────────────────────────────────────
// In production these rows live in the wc2026_venues Elasticsearch index
// and are returned by the ES|QL queries documented in each function below.

type ShuttleRow = { id: string; name: string; address: string; distanceKm: number; availableSeats: number }
type BarRow     = { id: string; name: string; address: string; distanceKm: number; availableSeats: number; rating: number; openUntil: string }

const SHUTTLE_DATA: Record<string, ShuttleRow[]> = {
  'New York':    [
    { id: 'sh-nyc-01', name: 'MetLife Express — East Rutherford Depot',  address: '300 Stadium Plaza, East Rutherford, NJ', distanceKm: 0.4, availableSeats: 18 },
    { id: 'sh-nyc-02', name: 'NJ Transit Fan Shuttle — Secaucus Hub',     address: 'Frank Lautenberg Rail Station, Secaucus', distanceKm: 1.2, availableSeats: 42 },
  ],
  'Los Angeles': [
    { id: 'sh-lax-01', name: 'SoFi Stadium Shuttle — Hawthorne Station', address: '11501 Crenshaw Blvd, Hawthorne, CA',       distanceKm: 0.8, availableSeats: 24 },
    { id: 'sh-lax-02', name: 'Inglewood Fan Bus — LAX Terminal C',        address: 'LAX Terminal C Arrivals, Los Angeles',     distanceKm: 3.1, availableSeats: 38 },
  ],
  'Miami':       [
    { id: 'sh-mia-01', name: 'Hard Rock Shuttle — Miami Gardens Hub',     address: 'NW 199th St & NW 27th Ave, Miami Gardens', distanceKm: 0.6, availableSeats: 15 },
    { id: 'sh-mia-02', name: 'Dolphin Expressway Fan Coach',              address: '12345 NW 7th Ave, Miami, FL',              distanceKm: 2.3, availableSeats: 30 },
  ],
  'Dallas':      [
    { id: 'sh-dal-01', name: 'AT&T Stadium Shuttle — Arlington Transit',  address: '900 Collins St, Arlington, TX',            distanceKm: 0.5, availableSeats: 22 },
    { id: 'sh-dal-02', name: 'DFW Fan Express — Dallas Convention Center',address: '650 S Griffin St, Dallas, TX',             distanceKm: 4.2, availableSeats: 50 },
  ],
  'Mexico City': [
    { id: 'sh-mex-01', name: 'Azteca Fan Metro — Tasqueña Station',       address: 'Calz. de Tlalpan 3465, CDMX',             distanceKm: 1.1, availableSeats: 60 },
    { id: 'sh-mex-02', name: 'Metro Bus Exprés — Copilco',                address: 'Av. Copilco 700, CDMX',                   distanceKm: 1.8, availableSeats: 40 },
  ],
  'Toronto':     [
    { id: 'sh-tor-01', name: 'TTC Fan Shuttle — Union Station',           address: '65 Front St W, Toronto, ON',              distanceKm: 0.9, availableSeats: 35 },
    { id: 'sh-tor-02', name: 'GO Transit Stadium Link — Exhibition',       address: 'Exhibition GO Station, Toronto',          distanceKm: 0.3, availableSeats: 28 },
  ],
  'Vancouver':   [
    { id: 'sh-van-01', name: 'SkyTrain Fan Express — Stadium-Chinatown',  address: '699 Beatty St, Vancouver, BC',            distanceKm: 0.2, availableSeats: 45 },
    { id: 'sh-van-02', name: 'Translink Fan Coach — Waterfront Station',   address: '601 W Cordova St, Vancouver, BC',         distanceKm: 0.7, availableSeats: 20 },
  ],
}

const BAR_DATA: Record<string, BarRow[]> = {
  'New York':    [
    { id: 'bar-nyc-01', name: 'Legends Bar & Grill',       address: '6 E 33rd St, New York, NY',             distanceKm: 0.3, availableSeats: 12, rating: 4.6, openUntil: '02:00' },
    { id: 'bar-nyc-02', name: 'Soccer Lounge NYC',          address: '145 W 44th St, New York, NY',           distanceKm: 0.8, availableSeats: 8,  rating: 4.4, openUntil: '01:00' },
  ],
  'Los Angeles': [
    { id: 'bar-lax-01', name: 'The Goal Post LA',           address: '1237 S Figueroa St, Los Angeles, CA',   distanceKm: 0.5, availableSeats: 20, rating: 4.5, openUntil: '02:00' },
    { id: 'bar-lax-02', name: 'Fútbol Cantina',             address: '9000 S Prairie Ave, Inglewood, CA',     distanceKm: 0.9, availableSeats: 15, rating: 4.3, openUntil: '00:00' },
  ],
  'Miami':       [
    { id: 'bar-mia-01', name: 'The Pitch Miami Gardens',   address: '2699 NW 199th St, Miami Gardens, FL',   distanceKm: 0.4, availableSeats: 18, rating: 4.7, openUntil: '02:00' },
    { id: 'bar-mia-02', name: 'Stadium View Bar',           address: '20020 NW 2nd Ave, Miami Gardens, FL',   distanceKm: 0.6, availableSeats: 9,  rating: 4.2, openUntil: '01:00' },
  ],
  'Dallas':      [
    { id: 'bar-dal-01', name: 'Champions Sports Bar',       address: '1241 E Lamar Blvd, Arlington, TX',      distanceKm: 0.7, availableSeats: 25, rating: 4.5, openUntil: '02:00' },
    { id: 'bar-dal-02', name: 'Texas Kick Off Bar',         address: '801 Six Flags Dr, Arlington, TX',       distanceKm: 1.2, availableSeats: 14, rating: 4.1, openUntil: '00:00' },
  ],
  'Mexico City': [
    { id: 'bar-mex-01', name: 'La Cantina del Azteca',      address: 'Calz. de Tlalpan 3500, CDMX',          distanceKm: 0.2, availableSeats: 30, rating: 4.8, openUntil: '02:00' },
    { id: 'bar-mex-02', name: 'Sports Bar 1986',            address: 'Av. Insurgentes Sur 3500, CDMX',        distanceKm: 0.9, availableSeats: 16, rating: 4.6, openUntil: '01:00' },
  ],
  'Toronto':     [
    { id: 'bar-tor-01', name: 'The Goalpost Toronto',       address: '1 Stadium Rd, Toronto, ON',             distanceKm: 0.3, availableSeats: 22, rating: 4.4, openUntil: '02:00' },
    { id: 'bar-tor-02', name: 'Liberty Village Sports Bar', address: '171 E Liberty St, Toronto, ON',         distanceKm: 0.8, availableSeats: 10, rating: 4.5, openUntil: '01:00' },
  ],
  'Vancouver':   [
    { id: 'bar-van-01', name: 'Craft Beer Market — BC Place',address: '85 W 1st Ave, Vancouver, BC',          distanceKm: 0.1, availableSeats: 28, rating: 4.6, openUntil: '01:00' },
    { id: 'bar-van-02', name: 'The Roxy Sports Bar',         address: '932 Granville St, Vancouver, BC',      distanceKm: 0.6, availableSeats: 18, rating: 4.3, openUntil: '02:00' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total  = h * 60 + m + minutes
  const nh     = Math.floor(total / 60) % 24
  const nm     = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function fallback<T>(map: Record<string, T[]>, city: string): T[] {
  return map[city] ?? map['New York'] ?? []
}

// ─── MongoDB Atlas MCP Tools ──────────────────────────────────────────────────

export interface MongoItinerary {
  userId:           string
  matchCity:        string
  venue:            string
  shuttleBookingId: string
  shuttleTime:      string
  airbnbId:         string
  checkInTime:      string
  checkOutTime:     string
}

/**
 * Agent Builder tool: mongodb_find
 * Collection: fan_itineraries
 * Filter:     { matchCity: city, userId: "fan-001" }
 *
 * Production: await mongoMCP.callTool({
 *   name: 'mongodb_find',
 *   arguments: { collection: 'fan_itineraries', filter: { matchCity: city } }
 * })
 */
export async function mongoFindItinerary(city: string): Promise<MongoItinerary> {
  // If a live Mongo MCP URL is configured, call it; otherwise fall back to stub
  if (MONGO_MCP_URL) {
    try {
      const result = await postJSON(`${MONGO_MCP_URL.replace(/\/$/,'')}/mongodb_find`, { city })
      return result as MongoItinerary
    } catch (err) {
      // fall through to stub on error
      console.warn('mongoFindItinerary remote call failed:', err)
    }
  }

  await delay(450)
  const rnd = () => Math.random().toString(36).slice(2, 8).toUpperCase()
  return {
    userId:           'fan-001',
    matchCity:         city,
    venue:             VENUE_MAP[city] ?? `${city} Stadium`,
    shuttleBookingId: `SH-${rnd()}`,
    shuttleTime:       '14:30',
    airbnbId:         `ABB-${rnd()}`,
    checkInTime:       '15:00',
    checkOutTime:      '11:00',
  }
}

/**
 * Agent Builder tool: mongodb_update_one
 * Collection: fan_bookings
 * Filter:     { _id: bookingId }
 * Update:     { $set: updates }
 *
 * Production: await mongoMCP.callTool({
 *   name: 'mongodb_update_one',
 *   arguments: { collection: 'fan_bookings', filter: { _id: bookingId }, update: { $set: updates } }
 * })
 */
export async function mongoUpdateBooking(
  _bookingId: string,
  _updates: Record<string, string>,
): Promise<{ acknowledged: boolean; modifiedCount: number }> {
  if (MONGO_MCP_URL) {
    try {
      const result = await postJSON(`${MONGO_MCP_URL.replace(/\/$/,'')}/mongodb_update_one`, { bookingId: _bookingId, updates: _updates })
      return result as { acknowledged: boolean; modifiedCount: number }
    } catch (err) {
      console.warn('mongoUpdateBooking remote call failed:', err)
    }
  }
  await delay(300)
  return { acknowledged: true, modifiedCount: 1 }
}

// ─── Elastic MCP Tools (via Elastic Agent Builder) ────────────────────────────
//
// All Elastic functions below map to Agent Builder tools backed by ES|QL queries.
// ES|QL reference: https://www.elastic.co/docs/reference/query-languages/esql
// Semantic search:  https://www.elastic.co/docs/solutions/search/semantic-search

export interface GeoSearchResult {
  id:             string
  name:           string
  type:           'shuttle' | 'sports_bar'
  address:        string
  distanceKm:     number
  availableSeats?: number
  nextDeparture?:  string
  rating?:         number
  openUntil?:      string
}

/**
 * Agent Builder tool: search_venues
 * Index: wc2026_venues
 *
 * ES|QL (shuttle, 5 km radius):
 *   FROM wc2026_venues
 *   | WHERE type == "shuttle" AND city == "{city}"
 *   | EVAL dist_m = ST_DISTANCE(location,
 *       TO_GEOPOINT("POINT({lon} {lat})"))
 *   | WHERE dist_m <= 5000 AND available_seats > 0
 *   | SORT dist_m ASC
 *   | LIMIT 5
 *   | EVAL dist_km = ROUND(dist_m / 1000, 1)
 *   | KEEP id, name, address, dist_km, available_seats, next_departure_time
 *
 * ES|QL (sports_bar, 3 km radius, ranked by rating):
 *   FROM wc2026_venues
 *   | WHERE type == "sports_bar" AND city == "{city}"
 *   | EVAL dist_m = ST_DISTANCE(location,
 *       TO_GEOPOINT("POINT({lon} {lat})"))
 *   | WHERE dist_m <= 3000 AND available_seats > 0
 *   | SORT rating DESC, dist_m ASC
 *   | LIMIT 5
 *   | EVAL dist_km = ROUND(dist_m / 1000, 1)
 *   | KEEP id, name, address, dist_km, available_seats, rating, open_until
 *
 * Production: await elasticMCP.callTool({
 *   name: 'search_venues',
 *   arguments: { city, type, radius_km: radiusKm }
 * })
 */
export async function elasticGeoSearch(
  city:          string,
  type:          'shuttle' | 'sports_bar',
  _radiusKm:     number,
  delayMinutes = 0,
): Promise<GeoSearchResult[]> {
  // If Elastic MCP URL is configured, call it and return results; otherwise use fixtures
  if (ELASTIC_MCP_URL) {
    try {
      const body = { city, type, radiusKm: _radiusKm, delayMinutes }
      const res = await postJSON(`${ELASTIC_MCP_URL.replace(/\/$/,'')}/search_venues`, body)
      return res as GeoSearchResult[]
    } catch (err) {
      console.warn('elasticGeoSearch remote call failed:', err)
    }
  }

  await delay(600)
  const coords = CITY_COORDS[city] ?? CITY_COORDS['New York']

  if (type === 'shuttle') {
    return fallback(SHUTTLE_DATA, city).map(s => ({
      ...s,
      type:          'shuttle' as const,
      nextDeparture: addMinutesToTime('14:30', delayMinutes + 15),
      _esql: `FROM wc2026_venues | WHERE type=="shuttle" AND city=="${city}" `
           + `| EVAL dist_m=ST_DISTANCE(location,TO_GEOPOINT("POINT(${coords.lon} ${coords.lat})")) `
           + `| WHERE dist_m<=5000 AND available_seats>0 | SORT dist_m ASC | LIMIT 5`,
    }))
  }

  return fallback(BAR_DATA, city).map(b => ({
    ...b,
    type: 'sports_bar' as const,
    _esql: `FROM wc2026_venues | WHERE type=="sports_bar" AND city=="${city}" `
         + `| EVAL dist_m=ST_DISTANCE(location,TO_GEOPOINT("POINT(${coords.lon} ${coords.lat})")) `
         + `| WHERE dist_m<=3000 AND available_seats>0 | SORT rating DESC,dist_m ASC | LIMIT 5`,
  }))
}

/**
 * Agent Builder tool: transit_telemetry
 * Index: wc2026_transit_telemetry
 *
 * ES|QL:
 *   FROM wc2026_transit_telemetry
 *   | WHERE vehicle_id == "{shuttleId}"
 *   | SORT @timestamp DESC
 *   | LIMIT 1
 *   | EVAL occupancy_pct = ROUND(occupied / capacity * 100, 0)
 *   | KEEP vehicle_id, status, next_slot, capacity, occupied, occupancy_pct
 *
 * Production: await elasticMCP.callTool({
 *   name: 'transit_telemetry',
 *   arguments: { vehicle_id: shuttleId }
 * })
 */
export async function elasticTransitTelemetry(
  _shuttleId:    string,
  delayMinutes:  number,
): Promise<{ status: string; nextSlot: string; capacity: number; occupied: number }> {
  if (ELASTIC_MCP_URL) {
    try {
      const res = await postJSON(`${ELASTIC_MCP_URL.replace(/\/$/,'')}/transit_telemetry`, { shuttleId: _shuttleId, delayMinutes })
      return res as { status: string; nextSlot: string; capacity: number; occupied: number }
    } catch (err) {
      console.warn('elasticTransitTelemetry remote call failed:', err)
    }
  }
  await delay(380)
  return {
    status:   'available',
    nextSlot:  addMinutesToTime('14:30', delayMinutes + 15),
    capacity:  45,
    occupied:  Math.floor(Math.random() * 20) + 10,
  }
}

// ─── Elastic Memory Layer ─────────────────────────────────────────────────────
//
// Elastic Agent Builder lets agents write enriched insights back into
// Elasticsearch — turning raw signals into retrievable intelligence over time.
// This index acts as a persistent context layer the agent can recall
// on future disruptions for the same user / city.
//
// Index: wc2026_agent_memory
// Blog:  https://www.elastic.co/search-labs/blog/ai-agent-memory-management-elasticsearch

export interface AgentMemoryEntry {
  userId:       string
  sessionId:    string
  city:         string
  event:        string         // e.g. "disruption_recovery"
  delayMinutes: number
  shuttleId:    string
  barId:        string
  newCheckIn:   string
  resolvedAt:   string         // ISO timestamp
  summary:      string         // human-readable insight for future retrieval
}

/**
 * Agent Builder tool: write_agent_memory
 * Index: wc2026_agent_memory
 *
 * ES|QL (future recall query — semantic search over summaries):
 *   FROM wc2026_agent_memory
 *   | WHERE userId == "fan-001" AND city == "{city}"
 *   | SORT resolvedAt DESC
 *   | LIMIT 10
 *   | KEEP event, summary, resolvedAt
 *
 * Production (index / write via MCP Workflow):
 *   await elasticMCP.callTool({
 *     name: 'write_agent_memory',
 *     arguments: { index: 'wc2026_agent_memory', document: entry }
 *   })
 */
export async function writeAgentMemory(entry: AgentMemoryEntry): Promise<{ result: string; _id: string }> {
  if (ELASTIC_MCP_URL) {
    try {
      const res = await postJSON(`${ELASTIC_MCP_URL.replace(/\/$/,'')}/write_agent_memory`, { document: entry })
      return res as { result: string; _id: string }
    } catch (err) {
      console.warn('writeAgentMemory remote call failed:', err)
    }
  }
  await delay(250)
  // Stub — in production this writes a document to the Elasticsearch index
  // so future agent sessions can retrieve it via semantic search or ES|QL recall.
  return {
    result: 'created',
    _id:    `mem-${Date.now().toString(36)}`,
  }
}
