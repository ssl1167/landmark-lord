import { fail, ok } from '@/lib/api-response'
import { getLandmarkById, getLandmarkAiIntro, saveLandmarkAiIntro } from '@/lib/db'

const COZE_API_URL = process.env.COZE_API_URL || 'https://api.coze.cn/open_api/v2/chat'
const COZE_API_KEY = process.env.COZE_API_KEY || ''
const COZE_BOT_ID = process.env.COZE_BOT_ID || ''

async function callCozeAI(landmarkName: string, city: string, description: string, language: string): Promise<string> {
  const query = language === 'en'
    ? `Please provide an engaging introduction about ${landmarkName} in ${city}. Description: ${description}. Respond in English.`
    : `请为${landmarkName}（位于${city}）创作一段引人入胜的介绍。描述：${description}。请用中文回答。`

  const response = await fetch(COZE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COZE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: `landmark_intro_${Date.now()}`,
      bot_id: COZE_BOT_ID,
      user: `user_${Date.now()}`,
      query: query,
      stream: false,
    })
  })

  if (!response.ok) {
    throw new Error(`Coze API request failed: ${response.status}`)
  }

  const data = await response.json()

  if (data && Array.isArray(data.messages)) {
    const answerMessage = data.messages.find((msg: any) => msg.type === 'answer')
    if (answerMessage && answerMessage.content) {
      return answerMessage.content
    }
  }

  throw new Error('No valid response from Coze AI')
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const landmark = await getLandmarkById(id)
  if (!landmark) {
    return fail('地标不存在', 404, 404)
  }

  const { searchParams } = new URL(request.url)
  const language = searchParams.get('lang') === 'en' ? 'en' : 'cn'

  try {
    const existingIntro = await getLandmarkAiIntro(id, language)
    if (existingIntro && existingIntro.intro_text) {
      console.log('从数据库获取AI解说')
      return ok({ landmarkId: id, language, introText: existingIntro.intro_text })
    }

    console.log('数据库中不存在AI解说，调用Coze AI生成')

    const introText = await callCozeAI(landmark.name, landmark.city, landmark.description, language)

    await saveLandmarkAiIntro(id, language, introText)
    console.log('AI解说已保存到数据库')

    return ok({ landmarkId: id, language, introText })
  } catch (error) {
    console.error('Error generating AI intro:', error)
    const cn = `${landmark.name}位于${landmark.city}，${landmark.description} 在"地标领主"中，它既是打卡点，也是影响力成长、漂流瓶互动与AI文化解说的核心节点。`
    const en = `${landmark.name} is located in ${landmark.city}. ${landmark.description} In Landmark Lord, it acts as a check-in point, an influence-growth hub, and a cultural storytelling node.`

    const fallbackText = language === 'en' ? en : cn
    await saveLandmarkAiIntro(id, language, fallbackText)

    return ok({ landmarkId: id, language, introText: fallbackText })
  }
}