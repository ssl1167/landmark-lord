import { fail, ok } from '@/lib/api-response'
import { getMysqlConnection } from '@/lib/db'
import { getUserIdFromAuth } from '@/lib/auth'

function generateId() {
  return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11)
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id: bottleId } = await context.params

  if (!bottleId) {
    return fail('缺少漂流瓶ID', 400, 400)
  }

  let connection: any
  try {
    connection = await getMysqlConnection()
    const [rows] = await connection.execute(
      `SELECT c.id, c.content, c.created_at as createdAt,
              u.username as author, u.id as userId
       FROM bottle_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.bottle_id = ?
       ORDER BY c.created_at DESC`,
      [bottleId]
    )

    return ok(rows)
  } catch (error) {
    console.error('获取评论失败:', error)
    return fail('获取评论失败', 500, 500)
  } finally {
    connection?.release?.()
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: bottleId } = await context.params

  let connection: any
  try {
    const userId = await getUserIdFromAuth(request)
    if (!userId) return fail('未登录', 401, 401)

    const body = await request.json().catch(() => null)
    const content = String(body?.content ?? '').trim()

    if (!bottleId || !content) {
      return fail('缺少必要参数', 400, 400)
    }
    if (content.length > 1000) {
      return fail('评论过长，最多 1000 字', 400, 400)
    }

    connection = await getMysqlConnection()
    const [bottleCheck] = await connection.execute(
      'SELECT id FROM bottles WHERE id = ?',
      [bottleId]
    )

    if ((bottleCheck as any[]).length === 0) {
      return fail('漂流瓶不存在', 404, 404)
    }

    const id = generateId()

    await connection.execute(
      `INSERT INTO bottle_comments (id, bottle_id, user_id, content, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, bottleId, userId, content]
    )

    const [newComment] = await connection.execute(
      `SELECT c.id, c.content, c.created_at as createdAt,
              u.username as author, u.id as userId
       FROM bottle_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    )

    return ok((newComment as any[])[0])
  } catch (error: any) {
    console.error('创建评论失败:', error)
    if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
      return fail('用户或漂流瓶不存在，无法评论', 400, 400)
    }
    return fail('创建评论失败', 500, 500)
  } finally {
    connection?.release?.()
  }
}
