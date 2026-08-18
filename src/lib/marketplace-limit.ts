import { getAuthToken } from '@/lib/idempiere'

const API_URL = process.env.IDEMPIERE_API_URL || 'http://15.207.222.86:8080/api/v1'

export const RESTRICTED_LOGIN_TYPES = ['S', 'J']
export const DAILY_POST_LIMIT = 3

export async function loginTypeOf(userId: number): Promise<string> {
  try {
    const token = await getAuthToken()
    const response = await fetch(`${API_URL}/models/AD_User/${userId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Failed to fetch user ${userId}: ${response.status}`)
    const user = (await response.json()) as { MCS_LoginType?: unknown }
    const raw = user.MCS_LoginType
    return String(
      typeof raw === 'object' && raw
        ? (raw as { id?: unknown }).id || ''
        : raw || '',
    ).toUpperCase()
  } catch (error) {
    console.error('Could not read login type for user', userId, error)
    return ''
  }
}

export async function countTodayPosts(userId: number): Promise<number> {
  try {
    const token = await getAuthToken()
    const url = `${API_URL}/models/MCS_MarketPlaces?$filter=${encodeURIComponent(`MCS_PostedBy_ID eq ${userId}`)}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Failed to fetch listings for count: ${response.status}`)
    const data = (await response.json()) as { records?: Array<{ MCS_StartDate?: string; Created?: string }> }
    const records = data.records || []
    const now = new Date()
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    return records.filter((record) => {
      const date = new Date(String(record.MCS_StartDate || record.Created || ''))
      return !Number.isNaN(date.getTime()) && date.getTime() >= todayStart
    }).length
  } catch (error) {
    console.error('Could not count today listings for user', userId, error)
    return 0
  }
}

export interface DailyLimitStatus {
  restricted: boolean
  count: number
  limit: number
}

export async function getDailyLimitStatus(userId: number): Promise<DailyLimitStatus> {
  const loginType = await loginTypeOf(userId)
  const restricted = RESTRICTED_LOGIN_TYPES.includes(loginType)
  const count = restricted ? await countTodayPosts(userId) : 0
  return { restricted, count, limit: DAILY_POST_LIMIT }
}