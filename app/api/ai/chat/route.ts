import { fail, ok } from "@/lib/api-response"

const COZE_API_URL = process.env.COZE_API_URL || "https://api.coze.cn/open_api/v2/chat"
const COZE_API_KEY = process.env.COZE_API_KEY || ""
const COZE_BOT_ID = process.env.COZE_BOT_ID || ""

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const buildFallbackReply = (message: string) => {
  return `我已收到你的问题：“${message}”。\n\n给你一个快速建议：\n1. 先在地图上选择你感兴趣的地标查看详情；\n2. 优先打卡半径内（1km）可达点；\n3. 如果你告诉我“出发位置 + 可用时长 + 偏好（历史/拍照/美食）”，我可以继续给你生成更精确路线。`
}

async function callCozeChat(query: string): Promise<string> {
  if (!COZE_API_KEY || !COZE_BOT_ID) {
    throw new Error("未配置 AI 服务")
  }

  const response = await fetch(COZE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${COZE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: `map_ai_chat_${Date.now()}`,
      bot_id: COZE_BOT_ID,
      user: `user_${Date.now()}`,
      query,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI 服务请求失败: ${response.status}`)
  }

  const data = await response.json()
  if (data && Array.isArray(data.messages)) {
    const answerMessage = data.messages.find((msg: any) => msg.type === "answer")
    if (answerMessage?.content) {
      return String(answerMessage.content)
    }
  }
  throw new Error("AI 服务返回为空")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = String(body?.message ?? "").trim()
    const history = Array.isArray(body?.history) ? (body.history as ChatMessage[]) : []

    if (!message) {
      return fail("message 不能为空")
    }

    const context = history
      .slice(-8)
      .map((item) => `${item.role === "user" ? "用户" : "助手"}: ${item.content}`)
      .join("\n")
    const prompt = `你是“地标领主”地图应用的 AI 助手。回答要简洁、实用、中文优先。\n\n对话上下文：\n${context}\n\n用户最新问题：${message}`

    try {
      const reply = await callCozeChat(prompt)
      return ok({ reply })
    } catch {
      return ok({ reply: buildFallbackReply(message) })
    }
  } catch {
    return fail("请求体格式错误")
  }
}
