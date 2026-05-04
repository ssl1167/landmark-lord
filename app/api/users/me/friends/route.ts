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
      `SELECT u.id, u.email, u.username, u.avatar_url, u.role
       FROM users u
       JOIN friendships f ON u.id = f.friend_id
       WHERE f.user_id = ? AND f.status = 'accepted'
       ORDER BY u.username`,
      [userId]
    )

    return ok(rows)
  } catch (error) {
    console.error('获取好友列表失败:', error)
    return fail('获取好友列表失败', 500, 500)
  } finally {
    connection?.release?.()
  }
}
