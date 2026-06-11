#!/usr/bin/env node
const express = require('express')
const app = express()

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

app.use(express.json())

function addMinutesToTime(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`
}

app.post('/plan', (req, res) => {
  const body = req.body || {}
  res.json({
    status: 'accepted',
    message: `Orchestrator received: Follow ${body.team || 'team'} from ${body.startCity || 'city'}`,
    agents: ['orchestrator','flights','tickets','visa'],
    planId: `plan-${Date.now().toString(36)}`,
  })
})

app.post('/matches', (req, res) => {
  const { team = 'Team', stages = ['Group Stage'] } = req.body || {}
  const fixtures = []

  if (stages.includes('Group Stage')) {
    fixtures.push(
      {
        team1: team,
        team2: 'Brazil',
        stage: 'Group Stage',
        date: '2026-06-14',
        time: '19:00',
        city: 'Mexico City',
        country: 'Mexico',
        stadium: 'Estadio Azteca',
        ticketPrice: 145,
        ticketAvailable: true,
        flag1: '🇦🇷',
        flag2: '🇧🇷',
      },
      {
        team1: team,
        team2: 'Germany',
        stage: 'Group Stage',
        date: '2026-06-18',
        time: '16:00',
        city: 'Houston',
        country: 'USA',
        stadium: 'NRG Stadium',
        ticketPrice: 160,
        ticketAvailable: true,
        flag1: '🇦🇷',
        flag2: '🇩🇪',
      },
      {
        team1: team,
        team2: 'Canada',
        stage: 'Group Stage',
        date: '2026-06-22',
        time: '20:00',
        city: 'Toronto',
        country: 'Canada',
        stadium: 'BMO Field',
        ticketPrice: 150,
        ticketAvailable: false,
        flag1: '🇦🇷',
        flag2: '🇨🇦',
      },
    )
  }

  // Only return confirmed group-stage match dates for this mock.
  // Later rounds are not yet confirmed in the real World Cup schedule.

  res.json(fixtures)
})

app.post('/flights', (req, res) => {
  const { startCity = 'New York', cities = [] } = req.body || {}
  const flights = cities.map((city, index) => ({
    from: index === 0 ? startCity : cities[index - 1],
    to: city,
    airline: 'SkyWave Airlines',
    departure: '09:00',
    arrival: '12:30',
    price: 220 + index * 45,
    duration: '3h 30m',
  }))
  res.json(flights)
})

app.post('/hotels', (req, res) => {
  const { cities = [] } = req.body || {}
  const hotels = cities.map((city, index) => ({
    name: `${city} Fan Lodge`,
    city,
    stars: 4,
    pricePerNight: 145 + index * 20,
    nights: 2,
    distance: `${0.6 + index * 0.3} km`,
  }))
  res.json(hotels)
})

app.post('/visa', (req, res) => {
  const { nationality = 'United States', countries = [] } = req.body || {}
  const requirements = countries.map(country => ({
    country,
    requirement: country === 'USA' || country === 'Canada' ? 'Visa-free' : 'ETA required',
    processingTime: country === 'USA' || country === 'Canada' ? 'N/A' : '5 business days',
    fee: country === 'USA' || country === 'Canada' ? 0 : 25,
    notes: country === 'USA' || country === 'Canada' ? 'No visa required for this passport.' : 'Apply online before departure.',
  }))
  res.json(requirements)
})

app.post('/search_venues', (req, res) => {
  const { city, type, delayMinutes = 0 } = req.body || {}
  if (type === 'shuttle') {
    return res.json([
      { id: 'sh-local-01', name: `${city} Shuttle A`, address: '1 Main St', distanceKm: 0.4, availableSeats: 20, nextDeparture: addMinutesToTime('14:30', delayMinutes + 15), type: 'shuttle' },
      { id: 'sh-local-02', name: `${city} Shuttle B`, address: '2 Main St', distanceKm: 1.2, availableSeats: 40, nextDeparture: addMinutesToTime('14:30', delayMinutes + 30), type: 'shuttle' },
    ])
  }
  return res.json([
    { id: 'bar-local-01', name: `${city} Sports Bar A`, address: '10 Fan Rd', distanceKm: 0.3, availableSeats: 12, rating: 4.6, openUntil: '02:00', type: 'sports_bar' },
    { id: 'bar-local-02', name: `${city} Sports Bar B`, address: '20 Fan Rd', distanceKm: 0.8, availableSeats: 8, rating: 4.2, openUntil: '01:00', type: 'sports_bar' },
  ])
})

app.post('/transit_telemetry', (req, res) => {
  const { delayMinutes = 0 } = req.body || {}
  res.json({ status: 'available', nextSlot: addMinutesToTime('14:30', delayMinutes + 15), capacity: 45, occupied: Math.floor(Math.random() * 20) + 10 })
})

app.post('/write_agent_memory', (req, res) => {
  res.json({ result: 'created', _id: `mem-${Date.now().toString(36)}` })
})

app.post('/mongodb_find', (req, res) => {
  const { city } = req.body || {}
  const rnd = () => Math.random().toString(36).slice(2,8).toUpperCase()
  res.json({
    userId: 'fan-001',
    matchCity: city || 'Unknown',
    venue: `${city || 'City'} Stadium`,
    shuttleBookingId: `SH-${rnd()}`,
    shuttleTime: '14:30',
    airbnbId: `ABB-${rnd()}`,
    checkInTime: '15:00',
    checkOutTime: '11:00',
  })
})

app.post('/mongodb_update_one', (req, res) => {
  res.json({ acknowledged: true, modifiedCount: 1 })
})

const port = process.env.MOCK_MCP_PORT || 4000
app.listen(port, () => console.log(`Mock MCP server running on http://localhost:${port}`))
