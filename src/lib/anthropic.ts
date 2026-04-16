export interface AiResponse {
  recommended_gonggu_ids: string[]
  reasoning_bullets: string[]
  ask_followup?: string | null
}

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined
const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-opus-4-6'
const COOLDOWN_MS = 8_000

let lastCallAt = 0
const cache = new Map<string, AiResponse>()

export async function callAi(
  userMessage: string,
  systemPrompt: string,
): Promise<AiResponse> {
  if (!API_KEY) throw new Error('NO_KEY')

  const cacheKey = userMessage.trim().toLowerCase()
  if (cache.has(cacheKey)) return cache.get(cacheKey)!

  const now = Date.now()
  if (now - lastCallAt < COOLDOWN_MS) throw new Error('COOLDOWN')
  lastCallAt = now

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-cors': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const type = (body as { error?: { type?: string } })?.error?.type ?? 'API_ERROR'
    throw new Error(type)
  }

  const data = await res.json() as { content: Array<{ type: string; text?: string }> }
  const text = data.content.find(b => b.type === 'text')?.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('PARSE_ERROR')

  const parsed = JSON.parse(jsonMatch[0]) as AiResponse
  cache.set(cacheKey, parsed)
  return parsed
}

export function hasApiKey() {
  return Boolean(API_KEY)
}
