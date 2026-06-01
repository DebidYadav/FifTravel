'use client'

import { useState } from 'react'
import PlannerForm from '@/components/PlannerForm'
import AgentPanel from '@/components/AgentPanel'
import ItineraryView from '@/components/ItineraryView'
import DisruptionPanel from '@/components/DisruptionPanel'
import { AgentStatus, Itinerary, PlanRequest } from '@/lib/types'
import { runOrchestratorAgent } from '@/lib/mockAgents'

const INITIAL_AGENTS: AgentStatus[] = [
  { id: 'orchestrator', name: 'Orchestrator',          icon: '🧠', status: 'idle', message: 'Waiting for trip request…' },
  { id: 'flights',      name: 'Flight & Transit Agent', icon: '✈️', status: 'idle', message: 'Ready to scan routes.' },
  { id: 'tickets',      name: 'Ticket & Seat Agent',   icon: '🎟️', status: 'idle', message: 'Ready to check availability.' },
  { id: 'visa',         name: 'Visa & Border Agent',   icon: '🛂', status: 'idle', message: 'Ready to verify entry requirements.' },
]

export default function Home() {
  const [agents, setAgents]       = useState<AgentStatus[]>(INITIAL_AGENTS)
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading]     = useState(false)

  const updateAgent = (id: string, status: string, message: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: status as any, message } : a))
  }

  const handlePlan = async (req: PlanRequest) => {
    setLoading(true)
    setItinerary(null)
    setAgents(INITIAL_AGENTS)

    try {
      const result = await runOrchestratorAgent(req, updateAgent)
      setItinerary(result)
    } catch {
      updateAgent('orchestrator', 'error', 'Agent error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-green-400 mb-4 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-400 agent-pulse" />
            FIFA World Cup 2026 · Multi-Agent AI Concierge
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Follow Your Team <br />
            <span className="text-gradient">Across Three Nations</span>
          </h1>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto text-base">
            Our AI agents plan your entire cross-border fan journey — flights, tickets,
            hotels, and visa requirements — dynamically optimized to your budget.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Form + Agents + Disruption Panel */}
          <div className="lg:col-span-1 space-y-5">
            <div className="glass-strong rounded-2xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">
                🎯 Plan Your Trip
              </h2>
              <PlannerForm onSubmit={handlePlan} loading={loading} />
            </div>

            <AgentPanel agents={agents} />

            {/* Disruption Recovery — visible once an itinerary is generated */}
            {itinerary && <DisruptionPanel itinerary={itinerary} />}
          </div>

          {/* Right: Itinerary */}
          <div className="lg:col-span-2">
            {!itinerary && !loading && (
              <div className="glass rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-white mb-2">Your AI Concierge is Ready</h3>
                <p className="text-gray-400 max-w-sm">
                  Fill in your preferences and let our multi-agent system build the perfect
                  World Cup itinerary across the US, Mexico, and Canada.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center w-full max-w-xs">
                  {['🇺🇸 USA', '🇲🇽 Mexico', '🇨🇦 Canada'].map(c => (
                    <div key={c} className="glass rounded-xl p-3 text-sm text-gray-300">{c}</div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="glass rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-5xl mb-4 animate-spin">⚙️</div>
                <h3 className="text-lg font-bold text-white mb-2">Agents Working…</h3>
                <p className="text-gray-400 text-sm">Scanning flights, checking tickets, verifying visas.</p>
              </div>
            )}

            {itinerary && <ItineraryView itinerary={itinerary} />}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-600">
          <p>
            Powered by multi-agent AI (LangGraph / CrewAI pattern) ·
            🍃 MongoDB MCP · ⚡ Elastic MCP · Google Maps API
          </p>
          <p className="mt-1">FIFA World Cup 2026 · USA · Mexico · Canada</p>
        </div>
      </div>
    </main>
  )
}
