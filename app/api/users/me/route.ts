import { fail, ok } from "@/lib/api-response"
import { getUserById, getUserByUsername, updateUserProfile } from "@/lib/db"
import { getUserIdFromAuth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromAuth(request)
    if (!userId) return fail("未登录", 401, 401)
    const user = await getUserById(userId)
    if (!user) return fail("用户不存在", 404, 404)
    return ok({
      id: user.id,
      email: user.email,
      username: user.username ?? String(user.email).split("@")[0],
      avatarUrl: user.avatar_url ?? null,
      role: user.role,
    })
  } catch (error) {
    console.error("获取当前用户失败:", error)
    return fail("获取用户信息失败", 500, 500)
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromAuth(request)
    if (!userId) return fail("未登录", 401, 401)
    const body = await request.json().catch(() => null)
    const username = String(body?.username ?? "").trim()
    if (!username || username.length < 2 || username.length > 20) return fail("用户名长度需 2-20 字")

    const exists = await getUserByUsername(username)
    if (exists && exists.id !== userId) return fail("该用户名已被占用", 409, 409)

    const updated = await updateUserProfile(userId, { username })
    if (!updated) return fail("保存失败")
    return ok({
      id: updated.id,
      email: updated.email,
      username: updated.username,
      avatarUrl: updated.avatarUrl ?? updated.avatar_url ?? null,
      role: updated.role,
    })
  } catch (error) {
    console.error("更新当前用户失败:", error)
    return fail("保存失败", 500, 500)
  }
}
