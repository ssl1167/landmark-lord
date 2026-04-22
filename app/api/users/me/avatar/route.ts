import { fail, ok } from "@/lib/api-response"
import { updateUserAvatar } from "@/lib/db"
import path from "path"
import { mkdir, writeFile } from "fs/promises"

function getUserIdFromAuth(request: Request) {
  const auth = request.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : ""
  if (!token) return null
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const [userId] = decoded.split(":")
    return userId || null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const userId = getUserIdFromAuth(request)
  if (!userId) return fail("未登录", 401, 401)

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!file || typeof file === "string") return fail("缺少文件 file")

  const blob = file as unknown as { name?: string; arrayBuffer: () => Promise<ArrayBuffer> }
  const buf = Buffer.from(await blob.arrayBuffer())
  if (buf.length > 2 * 1024 * 1024) return fail("图片过大（最大 2MB）")

  const extRaw = String((blob.name || "").split(".").pop() || "png").toLowerCase()
  const ext = ["png", "jpg", "jpeg", "webp", "gif"].includes(extRaw) ? extRaw : "png"

  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadsDir, { recursive: true })

  const filename = `avatar_${userId}_${Date.now()}.${ext}`
  const fullPath = path.join(uploadsDir, filename)
  await writeFile(fullPath, buf)

  const avatarUrl = `/uploads/${filename}`
  const okSaved = await updateUserAvatar(userId, avatarUrl)
  if (!okSaved) return fail("保存头像失败")

  return ok({ avatarUrl })
}

