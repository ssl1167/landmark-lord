import { fail, ok } from '@/lib/api-response'
import { getLandmarkById, getMysqlConnection } from '@/lib/db'
import { getUserIdFromAuth } from '@/lib/auth'

function generateId() {
  return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const landmarkId = searchParams.get('landmarkId')

  if (!landmarkId) {
    return fail('缺少地标ID', 400, 400)
  }

  let connection: any
  try {
    connection = await getMysqlConnection()
    const [rows] = await connection.execute(
      `SELECT b.id,
              b.content,
              b.image_url as imageUrl,
              b.visibility,
              b.created_at as createdAt,
              u.username as author,
              u.id as userId,
              (SELECT COUNT(*) FROM bottle_likes bl WHERE bl.bottle_id = b.id) as likes,
              (SELECT COUNT(*) FROM bottle_comments bc WHERE bc.bottle_id = b.id) as comments
       FROM bottles b
       JOIN users u ON b.user_id = u.id
       WHERE b.landmark_id = ?
       ORDER BY b.created_at DESC`,
      [landmarkId]
    )

    return ok((rows as any[]).map((bottle) => ({
      ...bottle,
      likes: Number(bottle.likes || 0),
      comments: Number(bottle.comments || 0),
      hasImage: !!bottle.imageUrl,
    })))
  } catch (error) {
    console.error('获取漂流瓶失败:', error)
    return fail('获取漂流瓶失败', 500, 500)
  } finally {
    connection?.release?.()
  }
}

export async function POST(request: Request) {
  let connection: any
  try {
    const userId = await getUserIdFromAuth(request)
    if (!userId) return fail('未登录', 401, 401)

    const body = await request.json().catch(() => null)
    const landmarkId = String(body?.landmarkId ?? '').trim()
    const content = String(body?.content ?? '').trim()
    const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null
    const visibility = String(body?.visibility ?? 'public') === 'private' ? 'private' : 'public'

    if (!landmarkId || !content) {
      return fail('缺少必要参数', 400, 400)
    }
    if (content.length > 2000) {
      return fail('内容过长，最多 2000 字', 400, 400)
    }

    const landmark = await getLandmarkById(landmarkId)
    if (!landmark) {
      return fail('地标不存在', 404, 404)
    }

    connection = await getMysqlConnection()
    const id = generateId()

    await connection.execute(
      `INSERT INTO bottles (id, user_id, landmark_id, content, image_url, visibility, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, userId, landmarkId, content, imageUrl || null, visibility]
    )

    return ok({ id, message: '漂流瓶投递成功' })
  } catch (error: any) {
    console.error('创建漂流瓶失败:', error)
    if (error?.code === 'ER_NO_REFERENCED_ROW_2') {
      return fail('用户或地标不存在，无法投递漂流瓶', 400, 400)
    }
    return fail('创建漂流瓶失败', 500, 500)
  } finally {
    connection?.release?.()
  }
}
