import { ok } from '@/lib/api-response'
import { ranking } from '@/lib/mock-db'

export async function GET() {
  return ok(ranking)
}
