'use client'

import { DisruptionPlan } from '@/lib/types'

interface Props {
  plan: DisruptionPlan
  originalShuttleTime: string
  originalCheckIn: string
  onConfirm: () => void
  onDismiss: () => void
}

export default function ConfirmationModal({
  plan,
  originalShuttleTime,
  originalCheckIn,
  onConfirm,
  onDismiss,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="glass-strong rounded-2xl w-full max-w-lg p-6 space-y-5 border border-white/10 shadow-2xl fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">✅</span>
          <div>
            <h2 id="confirm-title" className="text-lg font-bold text-white">
              Recovery Plan Ready
            </h2>
            <p className="text-xs text-gray-400">
              Review the changes before we confirm your bookings
            </p>
          </div>
        </div>

        {/* Changes */}
        <div className="space-y-3">

          {/* Shuttle */}
          <div className="glass rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">
              🚌 Stadium Shuttle
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="line-through text-gray-500">{originalShuttleTime}</span>
              <span className="text-gray-500">→</span>
              <span className="text-green-400 font-bold">{plan.shuttle.nextDeparture}</span>
            </div>
            <p className="text-xs font-semibold text-white">{plan.shuttle.name}</p>
            <p className="text-xs text-gray-500">
              {plan.shuttle.address} &middot; {plan.shuttle.distanceKm} km away
              &middot; {plan.shuttle.availableSeats} seats available
            </p>
          </div>

          {/* Sports Bar */}
          <div className="glass rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              🍺 Sports Bar (watch the delay in style)
            </p>
            <p className="text-sm font-semibold text-white">{plan.sportsBar.name}</p>
            <p className="text-xs text-gray-400">{plan.sportsBar.address}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              <span>⭐ {plan.sportsBar.rating}</span>
              <span>💺 {plan.sportsBar.availableSeats} seats</span>
              <span>🕑 Open until {plan.sportsBar.openUntil}</span>
              <span>📍 {plan.sportsBar.distanceKm} km</span>
            </div>
          </div>

          {/* Airbnb */}
          <div className="glass rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">
              🏠 Airbnb Check-In Window
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="line-through text-gray-500">{originalCheckIn}</span>
              <span className="text-gray-500">→</span>
              <span className="text-green-400 font-bold">
                {plan.newCheckInWindow.start} – {plan.newCheckInWindow.end}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Window shifted by {plan.delayMinutes} minutes via MongoDB update
            </p>
          </div>
        </div>

        {/* Data sources badge */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">🍃 MongoDB</span>
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">⚡ Elastic</span>
          <span className="text-gray-600">· live booking & geo data</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:bg-white/5 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            ✓ Confirm & Book
          </button>
        </div>
      </div>
    </div>
  )
}
