import { fail, ok } from '@/lib/api-response'
import { getLandmarkById } from '@/lib/db'
import mysql from 'mysql2/promise'

// 生成唯一ID
function generateId() {
  return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11)
}

// 获取漂流瓶列表
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const landmarkId = searchParams.get('landmarkId')
  
  if (!landmarkId) {
    return fail('缺少地标ID', 400, 400)
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'landmarks',
    })

    const [rows] = await connection.execute(
      `SELECT b.id, b.content, b.image_url as imageUrl, b.visibility, b.created_at as createdAt,
              u.username as author, u.id as userId
       FROM bottles b
       JOIN users u ON b.user_id = u.id
       WHERE b.landmark_id = ?
       ORDER BY b.created_at DESC`,
      [landmarkId]
    )

    await connection.end()

    // 获取每个漂流瓶的点赞数和评论数
    const bottlesWithStats = await Promise.all((rows as any[]).map(async (bottle) => {
      const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'landmarks',
      })
      
      const [likes] = await conn.execute(
        'SELECT COUNT(*) as count FROM bottle_likes WHERE bottle_id = ?',
        [bottle.id]
      )
      const [comments] = await conn.execute(
        'SELECT COUNT(*) as count FROM bottle_comments WHERE bottle_id = ?',
        [bottle.id]
      )
      
      await conn.end()
      
      return {
        ...bottle,
        likes: (likes as any[])[0]?.count || 0,
        comments: (comments as any[])[0]?.count || 0,
        hasImage: !!bottle.imageUrl,
      }
    }))

    return ok(bottlesWithStats)
  } catch (error) {
    console.error('获取漂流瓶失败:', error)
    return fail('获取漂流瓶失败', 500, 500)
  }
}

// 创建漂流瓶
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { landmarkId, userId, content, imageUrl, visibility = 'public' } = body

    if (!landmarkId || !userId || !content) {
      return fail('缺少必要参数', 400, 400)
    }

    // 验证地标是否存在
    const landmark = await getLandmarkById(landmarkId)
    if (!landmark) {
      return fail('地标不存在', 404, 404)
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'landmarks',
    })

    const id = generateId()
    
    await connection.execute(
      `INSERT INTO bottles (id, user_id, landmark_id, content, image_url, visibility, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, userId, landmarkId, content, imageUrl || null, visibility]
    )

    await connection.end()

    return ok({ id, message: '漂流瓶投递成功' })
  } catch (error) {
    console.error('创建漂流瓶失败:', error)
    return fail('创建漂流瓶失败', 500, 500)
  }
}
