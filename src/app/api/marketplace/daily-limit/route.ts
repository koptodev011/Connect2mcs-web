import { NextRequest, NextResponse } from 'next/server'
import { verifyFavoriteUser } from '@/lib/favorite-session'
import { getDailyLimitStatus } from '@/lib/marketplace-limit'

export async function GET(request: NextRequest) {
  try {
    const userId = verifyFavoriteUser(
      request.cookies.get('mcs_favorite_user')?.value,
    )
    if (!userId) {
      return NextResponse.json({ restricted: false, count: 0, limit: 3 })
    }
    const status = await getDailyLimitStatus(userId)
    return NextResponse.json(status)
  } catch (error) {
    console.error('Failed to read daily listing limit:', error)
    return NextResponse.json(
      { restricted: false, count: 0, limit: 3, error: 'Could not read limit' },
      { status: 500 },
    )
  }
}