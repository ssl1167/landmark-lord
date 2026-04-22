import { ok } from '@/lib/api-response'
import { tasks } from '@/lib/mock-db'

export async function GET() {
  return ok(tasks)
}
