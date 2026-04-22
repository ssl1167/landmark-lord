import { ok } from '@/lib/api-response'
import { feed } from '@/lib/mock-db'

export async function GET() {
  return ok(feed)
}
