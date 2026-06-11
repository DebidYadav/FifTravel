import { NextRequest, NextResponse } from 'next/server'
import { PlanRequest } from '@/lib/types'
import { runOrchestratorAgent } from '@/lib/mockAgents'

export async function POST(req: NextRequest) {
  const body: PlanRequest = await req.json()

  const { team, budget, startCity } = body

  if (!team || !budget || !startCity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL?.trim()
  const USE_REMOTE_ORCHESTRATOR = ['1', 'true'].includes(
    process.env.USE_REMOTE_ORCHESTRATOR?.trim().toLowerCase() ?? ''
  )
  const source = USE_REMOTE_ORCHESTRATOR && ORCHESTRATOR_URL
    ? 'remote orchestrator'
    : 'local open-source generator'
  console.log(`[api/plan] Using ${source}`)

  if (USE_REMOTE_ORCHESTRATOR && ORCHESTRATOR_URL) {
    try {
      const res = await fetch(ORCHESTRATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        return NextResponse.json(data, { status: res.status })
      }
      throw new Error(`Orchestrator proxy returned status ${res.status}`)
    } catch (err) {
      console.error('Orchestrator proxy failed, falling back to local open-source flow:', err)
    }
  }

  try {
    const itinerary = await runOrchestratorAgent(body, () => {})
    return NextResponse.json(itinerary)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Itinerary generation failed', details: message }, { status: 500 })
  }
}
