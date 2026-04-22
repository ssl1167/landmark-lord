import { fail, ok } from '@/lib/api-response'
import { getLandmarkById, checkDuplicateCheckin, createCheckinRecord, updateInfluenceScore, updateGuardian, calculateDistance } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const landmarkId = body?.landmarkId as string | undefined
  const userId = body?.userId as string | undefined
  const latitude = Number(body?.latitude)
  const longitude = Number(body?.longitude)
  const duration = Number(body?.duration) || 0

  if (!landmarkId || !userId || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return fail('缺少必要参数 landmarkId / userId / latitude / longitude')
  }

  // 1. 检查地标是否存在
  const landmark = await getLandmarkById(landmarkId)
  if (!landmark) {
    return fail('地标不存在', 404, 404)
  }

  // 2. 计算距离并校验是否在半径内
  const distance = calculateDistance(latitude, longitude, landmark.latitude, landmark.longitude)
  const isValid = distance <= landmark.checkinRadius

  // 3. 检查是否重复打卡（24小时内）
  const duplicate = await checkDuplicateCheckin(userId, landmarkId)
  if (duplicate) {
    return fail('24小时内已在该地标打卡，请勿重复打卡')
  }

  // 4. 写入打卡记录
  const checkinId = await createCheckinRecord(userId, landmarkId, duration, isValid)
  if (!checkinId) {
    return fail('打卡记录创建失败')
  }

  // 5. 更新影响力分数（仅当打卡有效时）
  let influenceResult = null
  if (isValid) {
    // 基础分数50，根据停留时长额外加分
    const basePoints = 50
    const durationPoints = Math.min(Math.floor(duration / 60), 50) // 每60秒加1分，最多加50分
    const totalPoints = basePoints + durationPoints
    
    influenceResult = await updateInfluenceScore(userId, landmarkId, totalPoints)
    
    // 6. 更新守护者
    await updateGuardian(landmarkId)
  }

  return ok({
    landmarkId,
    userId,
    distance,
    radius: landmark.checkinRadius,
    isValid,
    checkinId,
    influenceAdded: isValid ? (influenceResult ? influenceResult.score : 50) : 0,
    message: isValid ? '打卡成功，影响力 +' + (influenceResult ? influenceResult.score : 50) : '距离过远，打卡失败',
  })
}
