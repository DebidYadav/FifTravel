'use client'

import { useState } from 'react'
import { Itinerary } from '@/lib/types'

interface Props {
  itinerary: Itinerary
}

export default function ItineraryView({ itinerary }: Props) {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingState, setBookingState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [bookingMessage, setBookingMessage] = useState<string | null>(null)
  const [bookingReference, setBookingReference] = useState<string | null>(null)
  const overBudget = itinerary.totalCost > itinerary.budget

  const openBookingModal = () => {
    setBookingMessage(null)
    setShowBookingModal(true)
  }

  const closeBookingModal = () => {
    if (bookingState !== 'pending') {
      setShowBookingModal(false)
      setBookingMessage(null)
    }
  }

  const bookingLinkForMatch = (match: typeof itinerary.matches[number]) => {
    const query = encodeURIComponent(`${match.team1} vs ${match.team2} ${match.city} ${match.date}`)
    return `https://www.fifa.com/tickets/?search=${query}`
  }

  const formatDateForFlightSearch = (date: string) => {
    const parts = date.split('-')
    return parts.length === 3 ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}` : date
  }

  const bookingLinkForFlight = (flight: typeof itinerary.flights[number], index: number) => {
    const matchDate = itinerary.matches[index]?.date
    const departure = matchDate ? formatDateForFlightSearch(matchDate) : ''
    const query = `${flight.from} to ${flight.to}${departure ? ` ${departure}` : ''}`
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`
  }

  const bookingLinkForHotel = (hotel: typeof itinerary.hotels[number]) =>
    `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.city)}`

  const handleConfirmBooking = async () => {
    setBookingState('pending')
    setBookingMessage(null)

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary }),
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null)
        throw new Error(errorBody?.error || 'Booking request failed')
      }

      const data = await res.json()
      setBookingReference(data.orderId ?? null)
      setBookingState('success')
      setBookingMessage(data.message || 'Your itinerary has been booked successfully.')
      setShowBookingModal(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setBookingState('error')
      setBookingMessage(message)
    }
  }

  return (
    <div className="space-y-6 fade-in-up">

      {/* Budget Summary */}
      <div className="glass-strong rounded-2xl p-5">
        <h2 className="text-lg font-bold text-white mb-4">
          🗺️ Trip Overview — <span className="text-gradient">{itinerary.team}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Cost', value: `$${itinerary.totalCost.toLocaleString()}`, color: overBudget ? 'text-red-400' : 'text-green-400' },
            { label: 'Budget', value: `$${itinerary.budget.toLocaleString()}`, color: 'text-blue-400' },
            { label: itinerary.savings > 0 ? 'Saved' : 'Over by', value: `$${Math.abs(itinerary.totalCost - itinerary.budget).toLocaleString()}`, color: overBudget ? 'text-red-400' : 'text-green-400' },
            { label: 'Matches', value: itinerary.matches.length, color: 'text-yellow-400' },
          ].map(item => (
            <div key={item.label} className="glass rounded-xl p-3 text-center">
              <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Cost Breakdown */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { label: '✈️ Flights', value: itinerary.flights.reduce((s, f) => s + f.price, 0) },
            { label: '🎟️ Tickets', value: itinerary.matches.reduce((s, m) => s + m.ticketPrice, 0) },
            { label: '🏨 Hotels', value: itinerary.hotels.reduce((s, h) => s + h.pricePerNight * h.nights, 0) },
            { label: '📋 Visas', value: itinerary.visaInfo.reduce((s, v) => s + v.fee, 0) },
          ].map(item => (
            <div key={item.label} className="glass rounded-lg p-2">
              <div className="text-white font-semibold">${item.value.toLocaleString()}</div>
              <div className="text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {itinerary.warnings.length > 0 && (
        <div className="space-y-2">
          {itinerary.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
              <span className="text-yellow-400 mt-0.5">⚠️</span>
              <p className="text-yellow-200 text-sm">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Match Schedule */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">🏟️ Match Schedule</h3>
        <div className="space-y-3">
          {itinerary.matches.map((m, i) => (
            <a
              key={i}
              href={bookingLinkForMatch(m)}
              target="_blank"
              rel="noopener noreferrer"
              className="group block glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-green-400/30"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{m.stage}</div>
                  <div className="text-base font-bold text-white">
                    {m.flag1} {m.team1} <span className="text-gray-400 font-normal">vs</span> {m.team2} {m.flag2}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {m.date} • {m.time} • {m.stadium}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold px-3 py-1.5 rounded-full ${m.ticketAvailable ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {m.ticketAvailable ? `$${m.ticketPrice}` : 'Sold Out'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{m.city}, {m.country}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 group-hover:text-green-300">Book tickets on FIFA</p>
            </a>
          ))}
        </div>
      </div>

      {/* Flights */}
      {itinerary.flights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">✈️ Flights</h3>
          <div className="space-y-2">
            {itinerary.flights.map((f, i) => (
              <a
                key={i}
                href={bookingLinkForFlight(f, i)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block glass rounded-xl px-4 py-3 transition hover:-translate-y-0.5 hover:border-cyan-400/30"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="text-sm text-white font-medium">
                    {f.from} → {f.to}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{f.airline}</span>
                    <span>{f.departure} – {f.arrival}</span>
                    <span>{f.duration}</span>
                  </div>
                  <div className="text-green-400 font-bold text-sm">${f.price}</div>
                </div>
                <p className="mt-3 text-xs text-gray-500 group-hover:text-cyan-300">Search this route on Google Flights</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Hotels */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">🏨 Hotels</h3>
        <div className="space-y-2">
          {itinerary.hotels.map((h, i) => (
            <a
              key={i}
              href={bookingLinkForHotel(h)}
              target="_blank"
              rel="noopener noreferrer"
              className="group block glass rounded-xl px-4 py-3 transition hover:-translate-y-0.5 hover:border-blue-400/30"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm text-white font-medium">{h.name}</div>
                  <div className="text-xs text-gray-400">{h.city} • {'⭐'.repeat(h.stars)} • {h.distance}</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 font-bold text-sm">${h.pricePerNight}/night</div>
                  <div className="text-xs text-gray-500">{h.nights} nights = ${h.pricePerNight * h.nights}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 group-hover:text-blue-300">View hotel on Booking.com</p>
            </a>
          ))}
        </div>
      </div>

      {/* Visa Info */}
      {itinerary.visaInfo.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">🛂 Visa / Border Compliance</h3>
          <div className="space-y-2">
            {itinerary.visaInfo.map((v, i) => (
              <div key={i} className={`glass rounded-xl px-4 py-3 flex items-start justify-between gap-4 flex-wrap border ${v.requirement === 'Visa-free' ? 'border-green-500/20' : 'border-yellow-500/30'}`}>
                <div>
                  <div className="text-sm font-semibold text-white">{v.country}</div>
                  <div className={`text-xs mt-0.5 ${v.requirement === 'Visa-free' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {v.requirement}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{v.notes}</div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>{v.processingTime}</div>
                  <div className="text-white font-semibold mt-0.5">{v.fee > 0 ? `$${v.fee}` : 'Free'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking status */}
      {bookingState === 'success' && bookingMessage && (
        <div className="glass rounded-2xl p-4 border border-green-500/20 text-green-200 text-sm">
          <div className="font-semibold">Booking confirmed!</div>
          <div>{bookingMessage}</div>
          {bookingReference && <div className="text-xs text-green-300 mt-1">Reference: {bookingReference}</div>}
        </div>
      )}

      {/* Book Button */}
      <button
        type="button"
        onClick={openBookingModal}
        disabled={bookingState === 'pending'}
        className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider
          bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400
          text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {bookingState === 'success'
          ? '✅ Itinerary Booked'
          : `🎟️ Book This Itinerary — $${itinerary.totalCost.toLocaleString()}`}
      </button>

      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-strong rounded-3xl w-full max-w-2xl p-6 space-y-6 border border-white/10 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">Confirm booking</p>
                <h2 className="text-2xl font-bold text-white">Finalize your itinerary</h2>
              </div>
              <button
                type="button"
                onClick={closeBookingModal}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="glass rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400">Travel summary</p>
                <p className="mt-3 text-sm text-white">{itinerary.matches.length} match{itinerary.matches.length > 1 ? 'es' : ''}</p>
                <p className="text-sm text-gray-400">{itinerary.flights.length} flight{itinerary.flights.length > 1 ? 's' : ''}</p>
                <p className="text-sm text-gray-400">{itinerary.hotels.length} hotel{itinerary.hotels.length > 1 ? 's' : ''}</p>
                <p className="text-sm text-gray-400">Visa / border checks: {itinerary.visaInfo.length}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400">Total cost</p>
                <p className="mt-3 text-3xl font-bold text-white">${itinerary.totalCost.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Budget: ${itinerary.budget.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Savings: ${itinerary.savings.toLocaleString()}</p>
              </div>
            </div>

            {bookingMessage && bookingState === 'error' && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {bookingMessage}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={closeBookingModal}
                disabled={bookingState === 'pending'}
                className="py-3 rounded-2xl border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingState === 'pending'}
                className="py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {bookingState === 'pending' ? 'Booking…' : 'Confirm & Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
