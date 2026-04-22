import { createHash, randomBytes } from "crypto"
import { fail, ok } from "@/lib/api-response"
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db"

function hashPassword(raw: string, salt: string) {
  return createHash("sha256").update(`${raw}:${salt}`).digest("hex")
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const username = String(body?.username ?? "").trim()
  const email = String(body?.email ?? "").trim().toLowerCase()
  const password = String(body?.password ?? "")

  if (!email || !password) return fail("邮箱和密码不能为空")
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

  const token = Buffer.from(`${created.id}:${Date.now()}`).toString("base64url")
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
}
