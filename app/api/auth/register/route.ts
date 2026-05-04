import { createHash, randomBytes } from "crypto"
import { fail, ok } from "@/lib/api-response"
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db"
import { createSessionToken } from "@/lib/auth"

function hashPassword(raw: string, salt: string) {
  return createHash("sha256").update(`${raw}:${salt}`).digest("hex")
}

function getSafeDbMessage(error: any) {
  if (error?.code === "ER_DUP_ENTRY") return "邮箱或用户名已被占用"
  if (error?.code === "ER_ACCESS_DENIED_ERROR") return "数据库账号无权限或密码错误"
  if (error?.code === "ER_NO_SUCH_TABLE") return "数据库表结构不完整，请确认 Railway 已导入最新 SQL"
  if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT" || error?.code === "ENOTFOUND") return "数据库连接失败，请检查 Vercel 的 DATABASE_URL"
  return "注册失败，请稍后重试"
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const username = String(body?.username ?? "").trim()
    const email = String(body?.email ?? "").trim().toLowerCase()
    const password = String(body?.password ?? "")

    if (!email || !password) return fail("邮箱和密码不能为空")
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail("邮箱格式不正确")
    if (!username || username.length < 2 || username.length > 20) return fail("用户名长度需 2-20 字")
    if (password.length < 6) return fail("密码长度至少 6 位")

    const usernameExists = await getUserByUsername(username)
    if (usernameExists) return fail("该用户名已被占用", 409, 409)

    const exists = await getUserByEmail(email)
    if (exists) return fail("该邮箱已注册", 409, 409)

    const salt = randomBytes(8).toString("hex")
    const passwordHash = `${salt}$${hashPassword(password, salt)}`
    const created = await createUser({ email, username, passwordHash })
    if (!created) return fail("注册失败")

    const token = createSessionToken(created.id)
    return ok({
      token,
      user: {
        id: created.id,
        email: created.email,
        username: created.username,
        avatarUrl: created.avatarUrl ?? null,
        role: created.role,
      },
    })
  } catch (error: any) {
    console.error("注册接口失败:", error)
    return fail(getSafeDbMessage(error), 500, 500)
  }
}
