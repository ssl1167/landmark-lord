import { createHash } from "crypto"
import { fail, ok } from "@/lib/api-response"
import { getUserByEmail } from "@/lib/db"

function verifyPassword(raw: string, stored: string) {
  const [salt, digest] = String(stored || "").split("$")
  if (!salt || !digest) return false
  const hashed = createHash("sha256").update(`${raw}:${salt}`).digest("hex")
  return hashed === digest
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email ?? "").trim().toLowerCase()
  const password = String(body?.password ?? "")

  if (!email || !password) return fail("邮箱和密码不能为空")

  const user = await getUserByEmail(email)
  if (!user) return fail("账号或密码错误", 401, 401)
  if (!verifyPassword(password, user.password_hash)) return fail("账号或密码错误", 401, 401)

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64url")
  return ok({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username ?? String(user.email).split("@")[0],
      avatarUrl: user.avatar_url ?? null,
      role: user.role,
    },
  })
}
