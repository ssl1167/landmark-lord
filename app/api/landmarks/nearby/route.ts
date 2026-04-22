import { fail, ok } from '@/lib/api-response'
import { getNearestLandmarks } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  const limit = Number(searchParams.get('limit') ?? 10)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return fail('缺少合法的 lat/lng 参数')
  }

  const result = await getNearestLandmarks(lat, lng, limit)

  return ok(result)
}
