import { createHmac, timingSafeEqual } from "crypto"

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (secret) return secret

  if (process.env.NODE_ENV === "production") {
    throw new Error("缺少 AUTH_SECRET：请在 Vercel Environment Variables 中配置一个随机长字符串。")
  }

  return "landmark-lord-dev-only-secret-change-before-production"
}

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64url")
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8")
}

function sign(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url")
}

export function createSessionToken(userId: string) {
  const now = Date.now()
  const payload = base64UrlEncode(JSON.stringify({ sub: userId, iat: now, exp: now + TOKEN_TTL_MS }))
  return `${payload}.${sign(payload)}`
}

export async function getUserIdFromToken(token: string): Promise<string | null> {
  if (!token) return null

  // 新 token：payload.signature，带 HMAC 签名和过期时间。
  if (token.includes(".")) {
    const [payload, signature] = token.split(".")
    if (!payload || !signature) return null

    const expected = sign(payload)
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null

    const data = JSON.parse(base64UrlDecode(payload)) as { sub?: string; exp?: number }
    if (!data.sub || !data.exp || Date.now() > data.exp) return null
    return data.sub
  }

  // 兼容旧版本 token，避免已登录用户立即全部失效。后续可以删除这段兼容逻辑。
  try {
    const decoded = base64UrlDecode(token)
    const [userId] = decoded.split(":")
    return userId || null
  } catch {
    return null
  }
}

export async function getUserIdFromAuth(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : ""
  if (!token) return null
  return getUserIdFromToken(token)
}
