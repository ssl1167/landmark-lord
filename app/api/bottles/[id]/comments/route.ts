import { fail, ok } from '@/lib/api-response'
import mysql from 'mysql2/promise'

// 生成唯一ID
function generateId() {
  return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11)
}

// 获取漂流瓶的评论列表
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id: bottleId } = await context.params

  if (!bottleId) {
    return fail('缺少漂流瓶ID', 400, 400)
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
      `SELECT c.id, c.content, c.created_at as createdAt,
              u.username as author, u.id as userId
       FROM bottle_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.bottle_id = ?
       ORDER BY c.created_at DESC`,
      [bottleId]
    )

    await connection.end()

    return ok(rows)
  } catch (error) {
    console.error('获取评论失败:', error)
    return fail('获取评论失败', 500, 500)
  }
}

// 创建新评论
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: bottleId } = await context.params

  try {
    const body = await request.json()
    const { userId, content } = body

    if (!bottleId || !userId || !content) {
      return fail('缺少必要参数', 400, 400)
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'landmarks',
    })

    // 验证漂流瓶是否存在
    const [bottleCheck] = await connection.execute(
      'SELECT id FROM bottles WHERE id = ?',
      [bottleId]
    )

    if ((bottleCheck as any[]).length === 0) {
      await connection.end()
      return fail('漂流瓶不存在', 404, 404)
    }

    const id = generateId()
    
    await connection.execute(
      `INSERT INTO bottle_comments (id, bottle_id, user_id, content, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, bottleId, userId, content]
    )

    // 获取新创建的评论（包含用户信息）
    const [newComment] = await connection.execute(
      `SELECT c.id, c.content, c.created_at as createdAt,
              u.username as author, u.id as userId
       FROM bottle_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    )

    await connection.end()

    return ok((newComment as any[])[0])
  } catch (error) {
    console.error('创建评论失败:', error)
    return fail('创建评论失败', 500, 500)
  }
}
