export interface AgentStatus {
  id: string
  name: string
  icon: string
  status: 'idle' | 'running' | 'done' | 'error'
  message: string
}

export interface Flight {
  from: string
  to: string
  airline: string
  departure: string
  arrival: string
  price: number
  duration: string
}

export interface Match {
  team1: string
  team2: string
  stage: string
  date: string
  time: string
  city: string
  country: string
  stadium: string
  ticketPrice: number
  ticketAvailable: boolean
  flag1: string
  flag2: string
}

export interface Hotel {
  name: string
  city: string
  stars: number
  pricePerNight: number
  nights: number
  distance: string
}

export interface VisaInfo {
  country: string
  requirement: string
  processingTime: string
  fee: number
  notes: string
}

export interface ItineraryDay {
  day: number
  date: string
  city: string
  country: string
  countryFlag: string
  activities: string[]
  match?: Match
  flight?: Flight
  hotel: Hotel
}

export interface Itinerary {
  totalCost: number
  budget: number
  savings: number
  team: string
  days: ItineraryDay[]
  flights: Flight[]
  matches: Match[]
  hotels: Hotel[]
  visaInfo: VisaInfo[]
  warnings: string[]
}

export interface PlanRequest {
  team: string
  budget: number
  startCity: string
  stages: string[]
  nationality: string
}

// ─── Disruption Recovery Types ────────────────────────────────────────────────

export interface DisruptionRequest {
  delayMinutes: number
  city: string
  venue: string
  matchDate: string
  originalShuttleTime: string
  airbnbCheckIn: string
}

export interface VenueOption {
  id: string
  name: string
  type: 'shuttle' | 'sports_bar' | 'transit'
  address: string
  distanceKm: number
  availableSeats?: number
  nextDeparture?: string
  rating?: number
  openUntil?: string
}

export interface DisruptionPlan {
  delayMinutes: number
  shuttle: VenueOption
  sportsBar: VenueOption
  newCheckInWindow: { start: string; end: string }
  estimatedExtraCost: number
}

export interface AgentThought {
  agentId: string
  agentName: string
  icon: string
  tool: string
  reasoning: string
  result: string
}

export interface ElasticMemoryEntry {
  id:           string
  city:         string
  event:        string
  delayMinutes: number
  summary:      string
  resolvedAt:   string
}
