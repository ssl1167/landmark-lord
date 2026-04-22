import { ok, fail } from '@/lib/api-response'
import mysql from 'mysql2/promise'
import { getUserIdFromToken } from '@/lib/auth'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return fail('未登录', 401, 401)
  
  try {
    const userId = await getUserIdFromToken(token)
    if (!userId) return fail('无效的token', 401, 401)
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'landmarks',
    })
    
    const [rows] = await connection.execute(
      `SELECT b.*, l.name as landmarkName
       FROM bottles b
       JOIN landmarks l ON b.landmark_id = l.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    )
    
    await connection.end()
    return ok(rows)
  } catch (error) {
    console.error('获取漂流瓶历史失败:', error)
    return fail('获取漂流瓶历史失败', 500, 500)
  }
}
