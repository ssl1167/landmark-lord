import { fail, ok } from "@/lib/api-response"
import { updateUserAvatar } from "@/lib/db"
import { getUserIdFromAuth } from "@/lib/auth"
import path from "path"
import { mkdir, writeFile } from "fs/promises"

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromAuth(request)
    if (!userId) return fail("未登录", 401, 401)

    const form = await request.formData().catch(() => null)
    const file = form?.get("file")
    if (!file || typeof file === "string") return fail("缺少文件 file")

    const blob = file as unknown as { name?: string; arrayBuffer: () => Promise<ArrayBuffer>; type?: string }
    const buf = Buffer.from(await blob.arrayBuffer())
    if (buf.length > 2 * 1024 * 1024) return fail("图片过大（最大 2MB）")

    const extRaw = String((blob.name || "").split(".").pop() || "png").toLowerCase()
    const ext = ["png", "jpg", "jpeg", "webp", "gif"].includes(extRaw) ? extRaw : "png"

    // 注意：Vercel Serverless 文件系统不是持久存储，生产环境建议换对象存储。
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    const filename = `avatar_${userId}_${Date.now()}.${ext}`
    const fullPath = path.join(uploadsDir, filename)
    await writeFile(fullPath, buf)

    const avatarUrl = `/uploads/${filename}`
    const okSaved = await updateUserAvatar(userId, avatarUrl)
    if (!okSaved) return fail("保存头像失败")

    return ok({ avatarUrl })
  } catch (error) {
    console.error("上传头像失败:", error)
    return fail("上传头像失败", 500, 500)
  }
}
