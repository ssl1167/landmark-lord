import { fail, ok } from '@/lib/api-response'
import { getLandmarkById } from '@/lib/db'
import { bottles, feed, ranking } from '@/lib/mock-db'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const landmark = await getLandmarkById(id)
  if (!landmark) {
    return fail('地标不存在', 404, 404)
  }

  return ok({
    ...landmark,
    radius: landmark.checkinRadius,
    bottles: bottles.filter((item) => item.landmarkId === id),
    feed,
    ranking,
  })
}
