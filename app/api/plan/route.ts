import { NextRequest, NextResponse } from 'next/server'
import { PlanRequest } from '@/lib/types'

// Simulate agent-driven itinerary generation
export async function POST(req: NextRequest) {
  const body: PlanRequest = await req.json()

  const { team, budget, startCity, stages, nationality } = body

  if (!team || !budget || !startCity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // This mirrors what the client-side mock agents do,
  // but as a real API endpoint for future LangGraph/CrewAI integration.
  return NextResponse.json({
    status: 'accepted',
    message: `Orchestrator received: Follow ${team} from ${startCity} on $${budget} budget.`,
    agents: ['orchestrator', 'flights', 'tickets', 'visa'],
    note: 'Connect a LangGraph or CrewAI backend here for real agent execution.',
  })
}
