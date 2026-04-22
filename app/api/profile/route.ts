import { ok } from '@/lib/api-response'
import { currentUser } from '@/lib/mock-db'

export async function GET() {
  return ok(currentUser)
}
