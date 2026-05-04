import { fail, ok } from '@/lib/api-response'
import { getLandmarkById, checkDuplicateCheckin, createCheckinRecord, updateInfluenceScore, updateGuardian, calculateDistance } from '@/lib/db'
import { getUserIdFromAuth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromAuth(request)
    if (!userId) return fail('未登录', 401, 401)

    const body = await request.json().catch(() => null)
    const landmarkId = body?.landmarkId as string | undefined
    const latitude = Number(body?.latitude)
    const longitude = Number(body?.longitude)
    const duration = Number(body?.duration) || 0

    if (!landmarkId || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return fail('缺少必要参数 landmarkId / latitude / longitude')
    }

    const landmark = await getLandmarkById(landmarkId)
    if (!landmark) {
      return fail('地标不存在', 404, 404)
    }

    const distance = calculateDistance(latitude, longitude, landmark.latitude, landmark.longitude)
    const isValid = distance <= landmark.checkinRadius

    const duplicate = await checkDuplicateCheckin(userId, landmarkId)
    if (duplicate) {
      return fail('24小时内已在该地标打卡，请勿重复打卡')
    }

    const checkinId = await createCheckinRecord(userId, landmarkId, duration, isValid, distance)
    if (!checkinId) {
      return fail('打卡记录创建失败')
    }

    let influenceResult = null
    let addedPoints = 0
    if (isValid) {
      const basePoints = 50
      const durationPoints = Math.min(Math.floor(duration / 60), 50)
      addedPoints = basePoints + durationPoints

      influenceResult = await updateInfluenceScore(userId, landmarkId, addedPoints)
      await updateGuardian(landmarkId)
    }

    return ok({
      landmarkId,
      userId,
      distance,
      radius: landmark.checkinRadius,
      isValid,
      checkinId,
      influenceAdded: addedPoints,
      currentInfluenceScore: influenceResult?.score ?? null,
      message: isValid ? '打卡成功，影响力 +' + addedPoints : '距离过远，打卡失败',
    })
  } catch (error: any) {
    console.error('打卡失败:', error)
    if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
      return fail('用户或地标不存在，无法打卡', 400, 400)
    }
    return fail('打卡失败，请稍后重试', 500, 500)
  }
}
