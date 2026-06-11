import { NextRequest, NextResponse } from 'next/server'
import { Itinerary } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const itinerary = body?.itinerary as Itinerary | undefined

  if (!itinerary || !Array.isArray(itinerary.matches) || itinerary.matches.length === 0) {
    return NextResponse.json({ error: 'Invalid itinerary payload' }, { status: 400 })
  }

  const bookingId = `BOOK-${Date.now().toString(36)}`
  return NextResponse.json({
    status: 'booked',
    orderId: bookingId,
    message: `Your itinerary for ${itinerary.team} is confirmed with ${itinerary.matches.length} match${itinerary.matches.length > 1 ? 'es' : ''}.`,
  })
}
