import { ok, fail } from '@/lib/api-response'
import { getMysqlConnection } from '@/lib/db'
import { getUserIdFromAuth } from '@/lib/auth'

export async function GET(request: Request) {
  let connection: any
  try {
    const userId = await getUserIdFromAuth(request)
    if (!userId) return fail('未登录', 401, 401)

    connection = await getMysqlConnection()
    const [rows] = await connection.execute(
      `SELECT l.*, li.score, li.level as influenceLevel, li.is_guardian
       FROM landmarks l
       JOIN landmark_influence li ON l.id = li.landmark_id
       WHERE li.user_id = ?
       ORDER BY li.score DESC`,
      [userId]
    )

    return ok(rows)
  } catch (error) {
    console.error('获取我的地标失败:', error)
    return fail('获取我的地标失败', 500, 500)
  } finally {
    connection?.release?.()
  }
}
