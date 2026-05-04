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
      `SELECT b.*, l.name as landmarkName
       FROM bottles b
       JOIN landmarks l ON b.landmark_id = l.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    )

    return ok(rows)
  } catch (error) {
    console.error('获取漂流瓶历史失败:', error)
    return fail('获取漂流瓶历史失败', 500, 500)
  } finally {
    connection?.release?.()
  }
}
