import type { Gonggu } from '@/types'

export const PROMPT_CHIPS = [
  { label: '부모님 선물', prompt: '부모님께 드릴 선물로 좋은 공구 추천해줘' },
  { label: '아이 간식', prompt: '아이들이 좋아할 과일 간식 공구 추천해줘' },
  { label: '캠핑용', prompt: '캠핑에서 먹기 좋은 과일 공구 추천해줘' },
  { label: '새벽배송', prompt: '새벽배송 가능한 공구 추천해줘' },
  { label: '2만원 이하', prompt: '2만원 이하로 살 수 있는 공구 추천해줘' },
  { label: '마감 임박', prompt: '곧 마감되는 공구 중 달성률 높은 것 추천해줘' },
]

interface GongguSummary {
  id: string
  title: string
  product_name: string
  description: string
  price: number
  progress_pct: number
  deadline: string
}

function toSummary(g: Gonggu): GongguSummary {
  return {
    id: g.id,
    title: g.title,
    product_name: g.products?.name ?? '',
    description: g.products?.description ?? '',
    price: g.sale_price,
    progress_pct: Math.round((g.current_quantity / g.min_quantity) * 100),
    deadline: g.deadline,
  }
}

export function buildSystemPrompt(gonggus: Gonggu[]): string {
  const openList = gonggus.filter(g => g.status === 'open').map(toSummary)

  return `당신은 공구마켓의 친절한 AI 쇼핑 도우미입니다. 사용자의 요청을 이해하고, 현재 진행 중인 공구 목록에서 가장 잘 맞는 공구를 최대 3개 추천합니다.

== 현재 진행 중인 공구 목록 (JSON) ==
${JSON.stringify(openList, null, 2)}

== 응답 규칙 ==
- 반드시 아래 JSON 형식만 반환하세요. 다른 텍스트, 마크다운 코드블록 없이 순수 JSON.
- recommended_gonggu_ids: 추천 공구 id 배열 (최대 3개). 조건에 맞는 것이 없으면 [].
- reasoning_bullets: 사용자에게 보여줄 추천 이유 목록 (2~4개, 간결한 한국어 문장).
  - 가격, 마감일, 달성률, 상품 특징 중 관련된 것을 언급.
- ask_followup: 사용자 조건이 불명확하거나 추가 정보가 있으면 후속 질문 1개. 충분히 명확하면 null.

== 출력 형식 (예시) ==
{
  "recommended_gonggu_ids": ["uuid1", "uuid2"],
  "reasoning_bullets": ["산지 직송이라 신선도가 높아요", "마감이 3일 남아 여유 있어요"],
  "ask_followup": null
}`
}

/** API 키 없거나 실패 시 키워드 기반 폴백 */
export function keywordFallback(
  query: string,
  gonggus: Gonggu[],
): { recommended_gonggu_ids: string[]; reasoning_bullets: string[] } {
  const words = query.toLowerCase().split(/\s+/)
  const open = gonggus.filter(g => g.status === 'open')

  const scored = open.map(g => {
    const haystack =
      `${g.title} ${g.products?.name ?? ''} ${g.products?.description ?? ''}`.toLowerCase()
    const score = words.filter(w => w.length > 1 && haystack.includes(w)).length
    return { g, score }
  })

  const matched = scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.g.id)

  const ids = matched.length > 0
    ? matched
    : open.sort((a, b) =>
        b.current_quantity / b.min_quantity - a.current_quantity / a.min_quantity,
      ).slice(0, 3).map(g => g.id)

  return {
    recommended_gonggu_ids: ids,
    reasoning_bullets: matched.length > 0
      ? ['입력하신 키워드와 가장 잘 맞는 공구를 골랐어요.']
      : ['현재 달성률이 높은 공구를 추천드려요.'],
  }
}
