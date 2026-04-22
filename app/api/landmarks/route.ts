import { ok } from '@/lib/api-response'
import { getAllLandmarks } from '@/lib/db'

export async function GET() {
  const landmarks = await getAllLandmarks()
  return ok(landmarks)
}
