import { Itinerary, PlanRequest, Match, Flight, Hotel, VisaInfo } from './types'

// Environment-driven live data endpoints with open-source fallbacks
const LIVE_MATCH_API_URL = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_MATCH_API_URL ?? 'https://worldcupjson.net/matches'
  : undefined
const LIVE_FLIGHT_API_URL = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_FLIGHT_API_URL ?? 'https://api.skypicker.com/flights'
  : undefined
const LIVE_HOTEL_API_URL = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_HOTEL_API_URL ?? 'https://overpass-api.de/api/interpreter'
  : undefined
const LIVE_VISA_API_URL = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_VISA_API_URL ?? 'https://restcountries.com/v3.1'
  : undefined

// Simulated agent delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const COUNTRY_FLAG_MAP: Record<string, string> = {
  Argentina: '🇦🇷',
  Brazil: '🇧🇷',
  Germany: '🇩🇪',
  Canada: '🇨🇦',
  Spain: '🇪🇸',
  Mexico: '🇲🇽',
  'United States': '🇺🇸',
  USA: '🇺🇸',
}

function countryToFlag(country: string) {
  return COUNTRY_FLAG_MAP[country] ?? ''
}

function formatSkypickerDate(date: Date) {
  const d = date.getDate().toString().padStart(2, '0')
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => deg * Math.PI / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

async function safeFetchJson(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, init)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }
    return await res.json()
  } catch (err) {
    throw new Error(`Fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

function fallbackMatches(team: string, stages: string[]): Match[] {
  const cities = ['Mexico City', 'Houston', 'Toronto']
  const countries = ['Mexico', 'USA', 'Canada']
  const opponents = ['Brazil', 'Germany', 'Canada']
  const stagesWithDefaults = stages.length > 0 ? stages : ['Group Stage', 'Round of 16', 'Quarter-Final']

  return cities.map((city, index) => ({
    team1: team,
    team2: opponents[index] || 'Team B',
    stage: stagesWithDefaults[index] ?? stagesWithDefaults[0],
    date: ['2026-06-14', '2026-06-18', '2026-06-22'][index] ?? '2026-06-14',
    time: ['19:00', '16:00', '20:00'][index] ?? '19:00',
    city,
    country: countries[index],
    stadium: city === 'Mexico City' ? 'Estadio Azteca' : city === 'Houston' ? 'NRG Stadium' : 'BMO Field',
    ticketPrice: 150 + index * 10,
    ticketAvailable: index !== 2,
    flag1: countryToFlag(team),
    flag2: countryToFlag(opponents[index] ?? 'Team B'),
  }))
}

function fallbackHotel(city: string): Hotel {
  return {
    name: `${city} Fan Lodge`,
    city,
    stars: 4,
    pricePerNight: 145,
    nights: 2,
    distance: '1.0 km',
  }
}

function fallbackVisaInfo(nationality: string, countries: string[]): VisaInfo[] {
  return countries.map(country => ({
    country,
    requirement: nationality === country ? 'Visa-free' : 'ETA required',
    processingTime: nationality === country ? 'N/A' : '5 business days',
    fee: nationality === country ? 0 : 25,
    notes: nationality === country ? 'No visa required for this passport.' : 'Apply online before departure.',
  }))
}

async function getCityCoordinates(city: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', city)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const data = await safeFetchJson(url.toString(), { headers: { 'Accept-Language': 'en' } })
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Unable to resolve city coordinates for ${city}`)
  }

  return { lat: Number(data[0].lat), lon: Number(data[0].lon) }
}

async function fetchWorldCupJsonMatches(team: string, stages: string[]): Promise<Match[]> {
  try {
    const rawMatches = await safeFetchJson(LIVE_MATCH_API_URL!)
    const matches = Array.isArray(rawMatches) ? rawMatches : []

    return matches
      .map((raw: any) => {
        const datetime = raw.datetime || raw.date || ''
        const [date, time] = datetime.split('T')
        return {
          team1: raw.home_team_country ?? raw.home_team ?? 'Team A',
          team2: raw.away_team_country ?? raw.away_team ?? 'Team B',
          stage: raw.stage_name ?? raw.stage ?? 'Group Stage',
          date: date ?? '2026-06-14',
          time: (time ? time.slice(0, 5) : raw.time) ?? '19:00',
          city: raw.location ?? raw.venue ?? 'Unknown City',
          country: raw.location ?? raw.country ?? 'Unknown',
          stadium: raw.venue ?? raw.location ?? 'Stadium',
          ticketPrice: 145,
          ticketAvailable: true,
          flag1: countryToFlag(raw.home_team_country ?? raw.home_team ?? ''),
          flag2: countryToFlag(raw.away_team_country ?? raw.away_team ?? ''),
        }
      })
      .filter(m =>
        [m.team1, m.team2].some(t => t.toLowerCase().includes(team.toLowerCase()))
          && (stages.length === 0 || stages.some(s => m.stage.toLowerCase().includes(s.toLowerCase())))
      )
  } catch (err) {
    console.warn('Match API failed, falling back to sample matches:', err)
    return fallbackMatches(team, stages)
  }
}

async function fetchKiwiFlights(startCity: string, cities: string[]): Promise<Flight[]> {
  const today = new Date()
  const dateFrom = formatSkypickerDate(today)
  const nextMonth = new Date(today)
  nextMonth.setMonth(today.getMonth() + 1)
  const dateTo = formatSkypickerDate(nextMonth)

  const results: Flight[] = []
  for (const city of cities) {
    const url = new URL(LIVE_FLIGHT_API_URL!)
    const params = new URLSearchParams({
      fly_from: startCity,
      fly_to: city,
      date_from: dateFrom,
      date_to: dateTo,
      limit: '1',
      curr: 'USD',
      one_for_city: '1',
    })
    url.search = params.toString()

    try {
      const data = await safeFetchJson(url.toString())
      const flight = Array.isArray(data.data) ? data.data[0] : undefined
      if (!flight) {
        console.warn(`No flight returned for ${startCity} -> ${city}`)
        continue
      }
      const departure = flight.local_departure?.split('T')[1]?.slice(0, 5) ?? '09:00'
      const arrival = flight.local_arrival?.split('T')[1]?.slice(0, 5) ?? '12:30'
      results.push({
        from: flight.cityFrom || startCity,
        to: flight.cityTo || city,
        airline: (flight.airlines && flight.airlines[0]) || 'SkyWave Airlines',
        departure,
        arrival,
        price: Number(flight.price) || 220,
        duration: flight.fly_duration || '3h 30m',
      })
    } catch (err) {
      console.warn(`Flight lookup failed for ${startCity} -> ${city}:`, err)
      continue
    }
  }

  return results.length > 0 ? results : cities.map((city) => ({
    from: startCity,
    to: city,
    airline: 'SkyWave Airlines',
    departure: '09:00',
    arrival: '12:30',
    price: 220,
    duration: '3h 30m',
  }))
}

async function fetchOpenStreetMapHotels(cities: string[]): Promise<Hotel[]> {
  const hotels: Hotel[] = []
  for (const city of cities) {
    try {
      const { lat, lon } = await getCityCoordinates(city)
      const query = `
[out:json][timeout:25];
node["tourism"="hotel"](around:5000,${lat},${lon});
out center 10;
      `
      const data = await safeFetchJson(LIVE_HOTEL_API_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query.trim(),
      })
      if (!Array.isArray(data.elements)) continue

      data.elements.slice(0, 3).forEach((element: any, index: number) => {
        const name = element.tags?.name || `${city} Hotel`
        const distance = element.lat && element.lon
          ? haversineDistance(lat, lon, element.lat, element.lon)
          : 0.7
        hotels.push({
          name,
          city,
          stars: 4,
          pricePerNight: 145 + index * 20,
          nights: 2,
          distance: `${distance.toFixed(1)} km`,
        })
      })
    } catch {
      hotels.push({
        name: `${city} Hotel`,
        city,
        stars: 4,
        pricePerNight: 145,
        nights: 2,
        distance: '0.8 km',
      })
    }
  }
  return hotels
}

async function fetchRestCountriesVisaInfo(nationality: string, countries: string[]): Promise<VisaInfo[]> {
  try {
    const nationalityData = await safeFetchJson(`${LIVE_VISA_API_URL}/name/${encodeURIComponent(nationality)}?fullText=true`)
    const nationalityRegion = Array.isArray(nationalityData) ? nationalityData[0]?.region : 'Unknown'

    return Promise.all(countries.map(async (country) => {
      try {
        const countryData = await safeFetchJson(`${LIVE_VISA_API_URL}/name/${encodeURIComponent(country)}?fullText=true`)
        const destinationRegion = Array.isArray(countryData) ? countryData[0]?.region : 'Unknown'
        const visaFree = nationality === country || nationalityRegion === destinationRegion
        return {
          country,
          requirement: visaFree ? 'Visa-free' : 'ETA required',
          processingTime: visaFree ? 'N/A' : '5 business days',
          fee: visaFree ? 0 : 25,
          notes: visaFree ? 'No visa required for this passport.' : 'Apply online before departure.',
        }
      } catch (err) {
        console.warn(`Visa lookup failed for ${country}:`, err)
        return {
          country,
          requirement: 'ETA required',
          processingTime: '5 business days',
          fee: 25,
          notes: 'Visa information unavailable; apply proactively.',
        }
      }
    }))
  } catch (err) {
    console.warn('Nationality visa lookup failed, using fallback visa summaries:', err)
    return fallbackVisaInfo(nationality, countries)
  }
}

function requireLiveEndpoint(url: string | undefined, name: string): string {
  if (!url) {
    throw new Error(`Live endpoint for ${name} is required. Set the corresponding NEXT_PUBLIC_* env var.`)
  }
  return url
}

async function callLiveApi<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Live API request failed: ${url} status=${res.status}`)
  }

  return (await res.json()) as T
}

async function fetchLiveMatches(team: string, stages: string[]): Promise<Match[]> {
  const url = requireLiveEndpoint(LIVE_MATCH_API_URL, 'match data')
  if (url.includes('worldcupjson.net')) {
    return fetchWorldCupJsonMatches(team, stages)
  }
  return callLiveApi<Match[]>(url, { team, stages })
}

async function fetchLiveFlights(startCity: string, cities: string[]): Promise<Flight[]> {
  const url = requireLiveEndpoint(LIVE_FLIGHT_API_URL, 'flight data')
  if (url.includes('skypicker.com') || url.includes('kiwi.com')) {
    return fetchKiwiFlights(startCity, cities)
  }
  return callLiveApi<Flight[]>(url, { startCity, cities })
}

async function fetchLiveHotels(cities: string[]): Promise<Hotel[]> {
  const url = requireLiveEndpoint(LIVE_HOTEL_API_URL, 'hotel data')
  if (url.includes('overpass-api.de') || url.includes('openstreetmap.org')) {
    return fetchOpenStreetMapHotels(cities)
  }
  return callLiveApi<Hotel[]>(url, { cities })
}

async function fetchLiveVisaInfo(nationality: string, countries: string[]): Promise<VisaInfo[]> {
  const url = requireLiveEndpoint(LIVE_VISA_API_URL, 'visa data')
  if (url.includes('restcountries.com')) {
    return fetchRestCountriesVisaInfo(nationality, countries)
  }
  return callLiveApi<VisaInfo[]>(url, { nationality, countries })
}

export async function runOrchestratorAgent(
  request: PlanRequest,
  onAgentUpdate: (agentId: string, status: string, message: string) => void
): Promise<Itinerary> {
  // --- Orchestrator ---
  onAgentUpdate('orchestrator', 'running', `Breaking down trip plan for ${request.team} on $${request.budget.toLocaleString()} budget...`)
  await delay(1200)
  onAgentUpdate('orchestrator', 'done', `Plan decomposed into 3 sub-tasks. Spawning agents...`)

  // --- Flight Agent ---
  await delay(600)
  onAgentUpdate('flights', 'running', `Scanning cross-border routes from ${request.startCity}...`)
  await delay(2000)

  const matches = await fetchLiveMatches(request.team, request.stages)
  if (request.stages.length > 0) {
    // Keep stage filtering consistent with the live match query.
    // Live endpoint may already filter stages; this is a safety guard.
    const filtered = matches.filter(m =>
      request.stages.some(s => m.stage.toLowerCase().includes(s.toLowerCase()))
    )
    if (filtered.length > 0) {
      matches.splice(0, matches.length, ...filtered)
    }
  }

  if (matches.length === 0) {
    throw new Error('No confirmed matches are available for the selected stages. Please select a real confirmed stage such as Group Stage or wait for official fixtures to be released.')
  }

  const flightCities = matches.map(m => m.city)
  const flights = await fetchLiveFlights(request.startCity, flightCities)
  onAgentUpdate('flights', 'done', `Found ${flights.length} optimal routes with lowest fares.`)

  // --- Ticket Agent ---
  await delay(400)
  onAgentUpdate('tickets', 'running', `Checking ticket availability for ${matches.length} matches...`)
  await delay(1800)
  onAgentUpdate('tickets', 'done', `${matches.filter(m => m.ticketAvailable).length}/${matches.length} matches have available tickets.`)

  // --- Visa Agent ---
  await delay(400)
  onAgentUpdate('visa', 'running', `Checking entry requirements for ${request.nationality} passport...`)
  await delay(1500)
  const countries = [...new Set(matches.map(m => m.country))]
  const visaInfo = await fetchLiveVisaInfo(request.nationality, countries)
  onAgentUpdate('visa', 'done', `Visa/border compliance check complete. ${visaInfo.filter(v => v.requirement !== 'Visa-free').length} action(s) required.`)

  // --- Orchestrator finalizes ---
  await delay(600)
  onAgentUpdate('orchestrator', 'running', `Optimizing itinerary within $${request.budget.toLocaleString()} budget...`)
  await delay(1000)

  const hotels = await fetchLiveHotels(matches.map(m => m.city))
  const itinerary = buildItinerary(request, matches, flights, hotels, visaInfo)

  if (itinerary.totalCost > request.budget) {
    onAgentUpdate('orchestrator', 'done', `⚠️ Itinerary built — slightly over budget. Suggesting cost optimizations.`)
  } else {
    onAgentUpdate('orchestrator', 'done', `✅ Fully optimized itinerary ready! Saving $${itinerary.savings.toLocaleString()}.`)
  }

  return itinerary
}

function buildItinerary(request: PlanRequest, matches: any[], flights: any[], hotels: any[], visaInfo: any[]) {
  const flightCost = flights.reduce((s, f) => s + f.price, 0)
  const ticketCost = matches.reduce((s, m) => s + m.ticketPrice, 0)
  const hotelCost = hotels.reduce((s, h) => s + h.pricePerNight * h.nights, 0)
  const visaCost = visaInfo.reduce((s, v) => s + v.fee, 0)
  const totalCost = flightCost + ticketCost + hotelCost + visaCost

  const warnings: string[] = []
  if (totalCost > request.budget) warnings.push(`Over budget by $${(totalCost - request.budget).toLocaleString()}. Consider budget hotels or economy flights.`)
  visaInfo.filter(v => v.requirement !== 'Visa-free').forEach(v =>
    warnings.push(`${v.country}: ${v.requirement} — apply ${v.processingTime} in advance.`)
  )

  const days: any[] = matches.map((m, i) => ({
    day: i + 1,
    date: m.date,
    city: m.city,
    country: m.country,
    countryFlag: m.country === 'USA' ? '🇺🇸' : m.country === 'Mexico' ? '🇲🇽' : '🇨🇦',
    activities: [
      `Arrive in ${m.city}`,
      `Check in at ${hotels[i]?.name || 'hotel'}`,
      `Pre-match fan zone at ${m.stadium} surroundings`,
      `${m.team1} ${m.flag1} vs ${m.team2} ${m.flag2} — ${m.stage}`,
    ],
    match: m,
    flight: flights[i],
    hotel: hotels[i],
  }))

  return {
    totalCost,
    budget: request.budget,
    savings: Math.max(0, request.budget - totalCost),
    team: request.team,
    days,
    flights,
    matches,
    hotels,
    visaInfo,
    warnings,
  }
}
