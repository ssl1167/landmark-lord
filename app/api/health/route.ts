import { ok, fail } from '@/lib/api-response'
import { getMysqlPool, initMySQL } from '@/lib/db'

export async function GET() {
  try {
    await initMySQL()
    const [rows] = await getMysqlPool().query('SELECT 1 AS ok')
    return ok({ status: 'UP', service: 'landmark-lord-api', database: (rows as any[])[0]?.ok === 1 ? 'UP' : 'UNKNOWN' })
  } catch (error) {
    console.error('健康检查失败:', error)
    return fail('数据库连接失败', 500, 500)
  }
}
