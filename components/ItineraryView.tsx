'use client'

import { Itinerary } from '@/lib/types'

interface Props {
  itinerary: Itinerary
}

export default function ItineraryView({ itinerary }: Props) {
  const overBudget = itinerary.totalCost > itinerary.budget

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
            <div key={i} className="glass rounded-2xl p-4">
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
            </div>
          ))}
        </div>
      </div>

      {/* Flights */}
      {itinerary.flights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">✈️ Flights</h3>
          <div className="space-y-2">
            {itinerary.flights.map((f, i) => (
              <div key={i} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
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
            ))}
          </div>
        </div>
      )}

      {/* Hotels */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">🏨 Hotels</h3>
        <div className="space-y-2">
          {itinerary.hotels.map((h, i) => (
            <div key={i} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm text-white font-medium">{h.name}</div>
                <div className="text-xs text-gray-400">{h.city} • {'⭐'.repeat(h.stars)} • {h.distance}</div>
              </div>
              <div className="text-right">
                <div className="text-blue-400 font-bold text-sm">${h.pricePerNight}/night</div>
                <div className="text-xs text-gray-500">{h.nights} nights = ${h.pricePerNight * h.nights}</div>
              </div>
            </div>
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

      {/* Book Button */}
      <button className="w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider
        bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400
        text-white shadow-lg transition-all">
        🎟️ Book This Itinerary — ${itinerary.totalCost.toLocaleString()}
      </button>
    </div>
  )
}
