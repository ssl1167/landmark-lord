import { ok } from '@/lib/api-response'
import { messages } from '@/lib/mock-db'

export async function GET() {
  return ok(messages)
}
