import { ok } from '@/lib/api-response'

export async function GET() {
  return ok({ status: 'UP', service: 'landmark-lord-api' })
}
