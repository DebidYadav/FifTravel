'use client'

import { useState } from 'react'
import {
  AgentStatus,
  AgentThought,
  DisruptionPlan,
  DisruptionRequest,
  Itinerary,
} from '@/lib/types'
import {
  DISRUPTION_AGENTS,
  runDisruptionOrchestrator,
} from '@/lib/disruptionAgents'
import AgentPanel from './AgentPanel'
import ConfirmationModal from './ConfirmationModal'

interface Props {
  itinerary: Itinerary
}

const DELAY_OPTIONS = [30, 60, 90, 120, 150, 180]

export default function DisruptionPanel({ itinerary }: Props) {
  const [open, setOpen]               = useState(false)
  const [delayMinutes, setDelay]      = useState(120)
  const [selectedCity, setCity]       = useState(itinerary.days[0]?.city ?? 'New York')
  const [loading, setLoading]         = useState(false)
  const [agents, setAgents]           = useState<AgentStatus[]>(DISRUPTION_AGENTS)
  const [thoughts, setThoughts]       = useState<AgentThought[]>([])
  const [plan, setPlan]               = useState<DisruptionPlan | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [confirmed, setConfirmed]     = useState(false)

  const updateAgent = (id: string, status: AgentStatus['status'], message: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status, message } : a))
  }

  const matchDay   = itinerary.days.find(d => d.city === selectedCity)
  const venue      = matchDay?.match?.stadium ?? `${selectedCity} Stadium`
  const matchDate  = matchDay?.match?.date ?? 'June 2026'
  const cities     = [...new Set(itinerary.days.map(d => d.city))]

  const handleSubmit = async () => {
    setLoading(true)
    setConfirmed(false)
    setPlan(null)
    setThoughts([])
    setAgents(DISRUPTION_AGENTS.map(a => ({ ...a, status: 'idle' as const })))

    const req: DisruptionRequest = {
      delayMinutes,
      city:                 selectedCity,
      venue,
      matchDate,
      originalShuttleTime: '14:30',
      airbnbCheckIn:       '15:00',
    }

    try {
      const result = await runDisruptionOrchestrator(req, updateAgent)
      setPlan(result.plan)
      setThoughts(result.thoughts)
      setShowModal(true)
    } catch {
      updateAgent('dis-orchestrator', 'error', 'Agent error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    setShowModal(false)
    setConfirmed(true)
  }

  const handleReset = () => {
    setOpen(false)
    setConfirmed(false)
    setPlan(null)
    setThoughts([])
    setAgents(DISRUPTION_AGENTS)
  }

  // ── Collapsed banner ──────────────────────────────────────────────────────
  if (!open) {
    return (
      <div className="glass rounded-2xl p-4 border border-yellow-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🚨</span>
            <div>
              <p className="text-sm font-semibold text-white">Flight Delayed?</p>
              <p className="text-xs text-gray-400">
                Rearrange your shuttle, find a sports bar &amp; adjust your check-in — autonomously.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-semibold hover:bg-yellow-500/30 transition-colors"
          >
            Handle Delay
          </button>
        </div>
      </div>
    )
  }

  // ── Expanded panel ────────────────────────────────────────────────────────
  return (
    <>
      <div className="glass-strong rounded-2xl p-5 space-y-5 border border-yellow-500/20 fade-in-up">

        {/* Panel header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🚨</span>
            <div>
              <h3 className="text-sm font-bold text-white">Disruption Recovery Agent</h3>
              <p className="text-xs text-gray-500">
                Powered by&nbsp;
                <span className="text-green-400 font-semibold">🍃 MongoDB MCP</span>
                &nbsp;&amp;&nbsp;
                <span className="text-yellow-400 font-semibold">⚡ Elastic MCP</span>
              </p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={handleReset}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              aria-label="Close disruption panel"
            >
              ✕
            </button>
          )}
        </div>

        {/* Input form */}
        {!loading && !confirmed && (
          <div className="space-y-4">
            {/* City selector */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                City / Match
              </label>
              <select
                value={selectedCity}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              >
                {cities.map(c => (
                  <option key={c} value={c} className="bg-gray-900">{c}</option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">📍 {venue}</p>
            </div>

            {/* Delay picker */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                Delay Duration —{' '}
                <span className="text-yellow-400 font-bold">{delayMinutes} min</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {DELAY_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDelay(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      delayMinutes === d
                        ? 'bg-yellow-500/30 border border-yellow-500/50 text-yellow-300'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    +{d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Natural-language preview */}
            <div className="glass rounded-xl p-3 space-y-1">
              <p className="text-white text-sm font-medium leading-relaxed">
                &ldquo;My flight to the match is delayed by {delayMinutes} minutes.
                Rearrange my stadium shuttle, find an open sports bar near the venue
                with available seating, and adjust my Airbnb check-in window.&rdquo;
              </p>
              <p className="text-xs text-gray-500">→ {venue}, {selectedCity} · {matchDate}</p>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 transition-opacity"
            >
              🤖 Rearrange My Trip
            </button>
          </div>
        )}

        {/* Live agent status */}
        {(loading || thoughts.length > 0) && !confirmed && (
          <AgentPanel agents={agents} />
        )}

        {/* Agent reasoning log */}
        {thoughts.length > 0 && !confirmed && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Agent Reasoning Log
            </p>
            {thoughts.map((t, i) => (
              <div key={i} className="glass rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span aria-hidden="true">{t.icon}</span>
                  <span className="text-xs font-semibold text-white">{t.agentName}</span>
                  <span className="text-xs text-blue-400 font-mono">→ {t.tool}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{t.reasoning}</p>
                <p className="text-xs text-green-400/80 leading-relaxed">{t.result}</p>
              </div>
            ))}
          </div>
        )}

        {/* Confirmed success state */}
        {confirmed && plan && (
          <div className="space-y-3 fade-in-up">
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-xl" aria-hidden="true">✅</span>
              <span className="text-sm font-bold">Trip rearranged successfully</span>
            </div>
            <div className="glass rounded-xl p-4 space-y-2 text-sm">
              <p className="text-gray-300">
                🚌 <span className="text-white font-semibold">{plan.shuttle.name}</span>
                {' '}— departs <span className="text-green-400">{plan.shuttle.nextDeparture}</span>
              </p>
              <p className="text-gray-300">
                🍺 <span className="text-white font-semibold">{plan.sportsBar.name}</span>
                {' '}— {plan.sportsBar.availableSeats} seats reserved
              </p>
              <p className="text-gray-300">
                🏠 Check-in window:{' '}
                <span className="text-white font-semibold">
                  {plan.newCheckInWindow.start} – {plan.newCheckInWindow.end}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Bookings written to MongoDB ·</span>
              <span>Geo data from Elastic</span>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-2 rounded-xl border border-white/10 text-gray-400 text-xs font-semibold hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Human-in-the-loop confirmation modal */}
      {showModal && plan && (
        <ConfirmationModal
          plan={plan}
          originalShuttleTime="14:30"
          originalCheckIn="15:00"
          onConfirm={handleConfirm}
          onDismiss={() => setShowModal(false)}
        />
      )}
    </>
  )
}
