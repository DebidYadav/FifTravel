import { Itinerary, PlanRequest } from './types'

// Simulated agent delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

const MATCHES: Record<string, any[]> = {
  Argentina: [
    {
      team1: 'Argentina', team2: 'Nigeria', stage: 'Group Stage',
      date: 'June 12, 2026', time: '3:00 PM', city: 'New York', country: 'USA',
      stadium: 'MetLife Stadium', ticketPrice: 210, ticketAvailable: true,
      flag1: '🇦🇷', flag2: '🇳🇬'
    },
    {
      team1: 'Argentina', team2: 'Poland', stage: 'Group Stage',
      date: 'June 17, 2026', time: '6:00 PM', city: 'Dallas', country: 'USA',
      stadium: 'AT&T Stadium', ticketPrice: 195, ticketAvailable: true,
      flag1: '🇦🇷', flag2: '🇵🇱'
    },
    {
      team1: 'Argentina', team2: 'Saudi Arabia', stage: 'Group Stage',
      date: 'June 22, 2026', time: '9:00 PM', city: 'Mexico City', country: 'Mexico',
      stadium: 'Estadio Azteca', ticketPrice: 175, ticketAvailable: true,
      flag1: '🇦🇷', flag2: '🇸🇦'
    },
    {
      team1: 'Argentina', team2: 'TBD', stage: 'Round of 16',
      date: 'July 1, 2026', time: '6:00 PM', city: 'Vancouver', country: 'Canada',
      stadium: 'BC Place', ticketPrice: 350, ticketAvailable: true,
      flag1: '🇦🇷', flag2: '🏳️'
    },
  ],
  Brazil: [
    {
      team1: 'Brazil', team2: 'Mexico', stage: 'Group Stage',
      date: 'June 13, 2026', time: '6:00 PM', city: 'Los Angeles', country: 'USA',
      stadium: 'SoFi Stadium', ticketPrice: 240, ticketAvailable: true,
      flag1: '🇧🇷', flag2: '🇲🇽'
    },
    {
      team1: 'Brazil', team2: 'France', stage: 'Group Stage',
      date: 'June 18, 2026', time: '9:00 PM', city: 'Guadalajara', country: 'Mexico',
      stadium: 'Estadio Akron', ticketPrice: 220, ticketAvailable: true,
      flag1: '🇧🇷', flag2: '🇫🇷'
    },
    {
      team1: 'Brazil', team2: 'TBD', stage: 'Round of 16',
      date: 'July 2, 2026', time: '3:00 PM', city: 'Toronto', country: 'Canada',
      stadium: 'BMO Field', ticketPrice: 370, ticketAvailable: true,
      flag1: '🇧🇷', flag2: '🏳️'
    },
  ],
  England: [
    {
      team1: 'England', team2: 'Iran', stage: 'Group Stage',
      date: 'June 14, 2026', time: '3:00 PM', city: 'Miami', country: 'USA',
      stadium: 'Hard Rock Stadium', ticketPrice: 200, ticketAvailable: true,
      flag1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flag2: '🇮🇷'
    },
    {
      team1: 'England', team2: 'USA', stage: 'Group Stage',
      date: 'June 20, 2026', time: '6:00 PM', city: 'Kansas City', country: 'USA',
      stadium: 'Arrowhead Stadium', ticketPrice: 260, ticketAvailable: true,
      flag1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flag2: '🇺🇸'
    },
    {
      team1: 'England', team2: 'TBD', stage: 'Round of 16',
      date: 'July 3, 2026', time: '6:00 PM', city: 'Seattle', country: 'USA',
      stadium: 'Lumen Field', ticketPrice: 340, ticketAvailable: true,
      flag1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flag2: '🏳️'
    },
  ],
  France: [
    {
      team1: 'France', team2: 'Australia', stage: 'Group Stage',
      date: 'June 15, 2026', time: '6:00 PM', city: 'San Francisco', country: 'USA',
      stadium: "Levi's Stadium", ticketPrice: 215, ticketAvailable: true,
      flag1: '🇫🇷', flag2: '🇦🇺'
    },
    {
      team1: 'France', team2: 'TBD', stage: 'Round of 16',
      date: 'July 4, 2026', time: '9:00 PM', city: 'Monterrey', country: 'Mexico',
      stadium: 'Estadio BBVA', ticketPrice: 330, ticketAvailable: true,
      flag1: '🇫🇷', flag2: '🏳️'
    },
  ],
  Germany: [
    {
      team1: 'Germany', team2: 'Japan', stage: 'Group Stage',
      date: 'June 16, 2026', time: '3:00 PM', city: 'Chicago', country: 'USA',
      stadium: 'Soldier Field', ticketPrice: 205, ticketAvailable: true,
      flag1: '🇩🇪', flag2: '🇯🇵'
    },
    {
      team1: 'Germany', team2: 'TBD', stage: 'Round of 16',
      date: 'July 5, 2026', time: '3:00 PM', city: 'Boston', country: 'USA',
      stadium: 'Gillette Stadium', ticketPrice: 320, ticketAvailable: true,
      flag1: '🇩🇪', flag2: '🏳️'
    },
  ],
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

  const matches = (MATCHES[request.team] || MATCHES['Argentina']).filter(m =>
    request.stages.length === 0 ||
    request.stages.some(s => m.stage.toLowerCase().includes(s.toLowerCase()))
  )

  const flights = buildFlights(request.startCity, matches)
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
  const visaInfo = buildVisaInfo(request.nationality, matches)
  onAgentUpdate('visa', 'done', `Visa/border compliance check complete. ${visaInfo.filter(v => v.requirement !== 'Visa-free').length} action(s) required.`)

  // --- Orchestrator finalizes ---
  await delay(600)
  onAgentUpdate('orchestrator', 'running', `Optimizing itinerary within $${request.budget.toLocaleString()} budget...`)
  await delay(1000)

  const hotels = buildHotels(matches)
  const itinerary = buildItinerary(request, matches, flights, hotels, visaInfo)

  if (itinerary.totalCost > request.budget) {
    onAgentUpdate('orchestrator', 'done', `⚠️ Itinerary built — slightly over budget. Suggesting cost optimizations.`)
  } else {
    onAgentUpdate('orchestrator', 'done', `✅ Fully optimized itinerary ready! Saving $${itinerary.savings.toLocaleString()}.`)
  }

  return itinerary
}

function buildFlights(startCity: string, matches: any[]) {
  const cities = [startCity, ...matches.map(m => m.city)]
  const flights = []
  for (let i = 0; i < cities.length - 1; i++) {
    if (cities[i] !== cities[i + 1]) {
      flights.push({
        from: cities[i],
        to: cities[i + 1],
        airline: ['United Airlines', 'American Airlines', 'Delta', 'Aeromexico', 'Air Canada'][i % 5],
        departure: '07:30 AM',
        arrival: '10:45 AM',
        price: Math.floor(150 + Math.random() * 200),
        duration: `${2 + (i % 3)}h ${15 + (i * 10) % 45}m`,
      })
    }
  }
  return flights
}

function buildHotels(matches: any[]) {
  const hotelNames: Record<string, string[]> = {
    'New York': ['Marriott Times Square', 'Hilton Midtown'],
    'Dallas': ['Omni Dallas Hotel', 'Westin Galleria'],
    'Mexico City': ['St. Regis Mexico City', 'Camino Real Polanco'],
    'Vancouver': ['Fairmont Pacific Rim', 'JW Marriott Parq'],
    'Los Angeles': ['The Beverly Hilton', 'Loews Hollywood'],
    'Guadalajara': ['Holiday Inn Guadalajara', 'Fiesta Americana'],
    'Toronto': ['Fairmont Royal York', 'InterContinental Toronto'],
    'Miami': ['W Miami', 'Conrad Miami'],
    'Kansas City': ['Loews Kansas City', 'Marriott Kansas City'],
    'Seattle': ['Hyatt Regency Seattle', 'Sheraton Grand Seattle'],
    'San Francisco': ['Marriott Union Square', 'Hilton Union Square'],
    'Monterrey': ['Fiesta Americana Monterrey', 'NH Collection Monterrey'],
    'Chicago': ['Hilton Chicago', 'Marriott Magnificent Mile'],
    'Boston': ['Boston Marriott Copley', 'Westin Copley Place'],
  }
  return matches.map(m => ({
    name: (hotelNames[m.city] || ['Grand Hotel'])[0],
    city: m.city,
    stars: 4,
    pricePerNight: Math.floor(120 + Math.random() * 150),
    nights: 2,
    distance: `${(0.5 + Math.random() * 3).toFixed(1)} km from stadium`,
  }))
}

function buildVisaInfo(nationality: string, matches: any[]) {
  const countries = [...new Set(matches.map(m => m.country))]
  const visaMap: Record<string, Record<string, any>> = {
    USA: {
      'US Citizen': { requirement: 'Visa-free', processingTime: 'N/A', fee: 0, notes: 'No visa required.' },
      'EU Citizen': { requirement: 'ESTA required', processingTime: '72 hours', fee: 21, notes: 'Apply at esta.cbp.dhs.gov. Valid 2 years.' },
      default: { requirement: 'B-2 Visa required', processingTime: '3–5 weeks', fee: 185, notes: 'Schedule appointment at US Embassy.' },
    },
    Mexico: {
      'US Citizen': { requirement: 'Visa-free (FMM)', processingTime: 'On arrival', fee: 0, notes: 'Tourist card issued at border/airport.' },
      'EU Citizen': { requirement: 'Visa-free (FMM)', processingTime: 'On arrival', fee: 0, notes: 'Tourist card issued at border/airport.' },
      default: { requirement: 'Mexico Tourist Visa', processingTime: '10 business days', fee: 36, notes: 'Apply at Mexican consulate.' },
    },
    Canada: {
      'US Citizen': { requirement: 'Visa-free', processingTime: 'N/A', fee: 0, notes: 'Valid passport required.' },
      'EU Citizen': { requirement: 'eTA required', processingTime: 'Minutes–72 hours', fee: 7, notes: 'Apply at canada.ca/eta before flying.' },
      default: { requirement: 'Temporary Resident Visa', processingTime: '2–4 weeks', fee: 100, notes: 'Apply online via IRCC portal.' },
    },
  }
  return countries.map(country => {
    const rules = visaMap[country] || {}
    const info = rules[nationality] || rules['default'] || { requirement: 'Check embassy', processingTime: 'Unknown', fee: 0, notes: '' }
    return { country, ...info }
  })
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
