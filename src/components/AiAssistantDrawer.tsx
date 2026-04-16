import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { callAi, hasApiKey } from '@/lib/anthropic'
import { buildSystemPrompt, keywordFallback, PROMPT_CHIPS } from '@/features/ai/prompts'
import type { Gonggu } from '@/types'

/* ── Types ── */
interface UserMsg { role: 'user'; text: string }
interface AssistantMsg {
  role: 'assistant'
  bullets: string[]
  recs: Gonggu[]
  followup: string | null
  isError?: boolean
}
type ChatMsg = UserMsg | AssistantMsg

/* ── D-day helper ── */
function getDday(deadline: string) {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (diff < 0) return '마감'
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
}

/* ── Recommendation card ── */
function RecCard({ gonggu, bullet }: { gonggu: Gonggu; bullet?: string }) {
  const navigate = useNavigate()
  const pct = Math.min(Math.round((gonggu.current_quantity / gonggu.min_quantity) * 100), 100)
  const dday = getDday(gonggu.deadline)

  let barColor = 'bg-zinc-300'
  if (pct >= 80) barColor = 'bg-green-500'
  else if (pct >= 50) barColor = 'bg-orange-400'

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-border"
      onClick={() => navigate(`/gonggu/${gonggu.id}`)}
    >
      <CardContent className="p-3 flex gap-3">
        {gonggu.products?.image_url ? (
          <img
            src={gonggu.products.image_url}
            alt={gonggu.products.name}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-xs">
            사진 없음
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-semibold leading-snug line-clamp-2">{gonggu.title}</p>
            <Badge
              variant={dday === '마감' ? 'secondary' : 'destructive'}
              className="text-[10px] shrink-0"
            >
              {dday}
            </Badge>
          </div>

          <p className="text-base font-bold text-primary">
            {gonggu.sale_price.toLocaleString()}원
          </p>

          <div className="space-y-0.5">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{pct}% 달성 · {gonggu.current_quantity}명 참여</p>
          </div>

          {bullet && (
            <p className="text-[11px] text-muted-foreground italic line-clamp-1">{bullet}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Loading skeleton ── */
function LoadingBubble() {
  return (
    <div className="flex gap-2 items-start">
      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-sm">
        ✦
      </div>
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  )
}

/* ── Main component ── */
interface Props {
  open: boolean
  onClose: () => void
  gonggus: Gonggu[]
  initialPrompt?: string
}

export default function AiAssistantDrawer({ open, onClose, gonggus, initialPrompt }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sentInitial = useRef(false)

  /* Auto-send initial prompt once when drawer opens */
  useEffect(() => {
    if (open && initialPrompt && !sentInitial.current) {
      sentInitial.current = true
      handleSend(initialPrompt)
    }
    if (!open) {
      sentInitial.current = false
    }
  }, [open, initialPrompt]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* Cooldown countdown */
  useEffect(() => {
    if (cooldownLeft <= 0) return
    const timer = setInterval(() => setCooldownLeft(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldownLeft])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    try {
      let result
      if (hasApiKey()) {
        const systemPrompt = buildSystemPrompt(gonggus)
        result = await callAi(msg, systemPrompt)
      } else {
        result = keywordFallback(msg, gonggus)
      }

      const recs = gonggus.filter(g => result.recommended_gonggu_ids.includes(g.id))
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          bullets: (result as { reasoning_bullets?: string[] }).reasoning_bullets ?? [],
          recs,
          followup: (result as { ask_followup?: string | null }).ask_followup ?? null,
        },
      ])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : ''
      const fallback = keywordFallback(msg, gonggus)
      const recs = gonggus.filter(g => fallback.recommended_gonggu_ids.includes(g.id))

      let errorNote = '키워드 기반으로 추천했어요.'
      if (errMsg === 'COOLDOWN') {
        setCooldownLeft(8)
        errorNote = '잠시 후 다시 시도해주세요 (쿨다운 중).'
      } else if (errMsg === 'NO_KEY') {
        errorNote = 'API 키가 없어 키워드 기반으로 추천했어요.'
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          bullets: [errorNote, ...fallback.reasoning_bullets],
          recs,
          followup: null,
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = messages.length === 0 && !loading

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">

        {/* Header */}
        <SheetHeader className="px-4 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
              ✦
            </div>
            <div>
              <SheetTitle className="text-base">AI 쇼핑 도우미</SheetTitle>
              <p className="text-xs text-muted-foreground">원하는 조건을 말하면 추천해드려요</p>
            </div>
          </div>
        </SheetHeader>

        {/* Chat area */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-5">

            {/* Welcome + chips (only when no messages) */}
            {isEmpty && (
              <div className="space-y-4">
                <div className="bg-muted/60 rounded-2xl p-4 space-y-1.5">
                  <p className="text-sm font-medium">안녕하세요! 어떤 공구를 찾으시나요?</p>
                  <p className="text-xs text-muted-foreground">
                    아래 버튼을 클릭하거나 직접 입력해주세요.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">빠른 선택</p>
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_CHIPS.map(chip => (
                      <button
                        key={chip.label}
                        onClick={() => handleSend(chip.prompt)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors font-medium"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                {msg.role === 'user' ? (
                  /* User bubble */
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  /* Assistant response */
                  <div className="flex gap-2 items-start">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-sm text-primary mt-0.5">
                      ✦
                    </div>
                    <div className="flex-1 space-y-3">
                      {/* Error badge */}
                      {msg.isError && (
                        <Badge variant="secondary" className="text-[10px]">
                          키워드 모드
                        </Badge>
                      )}

                      {/* Reasoning bullets */}
                      {msg.bullets.length > 0 && (
                        <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 space-y-1">
                          {msg.bullets.map((b, j) => (
                            <p key={j} className="text-sm text-foreground leading-snug">
                              {j === 0 ? b : `· ${b}`}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Recommendation cards */}
                      {msg.recs.length > 0 && (
                        <div className="space-y-2">
                          {msg.recs.map((g, j) => (
                            <RecCard
                              key={g.id}
                              gonggu={g}
                              bullet={msg.bullets[j + 1]}
                            />
                          ))}
                        </div>
                      )}

                      {msg.recs.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          조건에 맞는 공구를 찾지 못했어요. 다른 조건을 말씀해주세요.
                        </p>
                      )}

                      {/* Follow-up question */}
                      {msg.followup && (
                        <>
                          <Separator />
                          <div className="bg-primary/5 border border-primary/15 rounded-xl px-3 py-2">
                            <p className="text-xs text-muted-foreground mb-1">추가 질문</p>
                            <p className="text-sm">{msg.followup}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && <LoadingBubble />}

            {/* Chips after first interaction */}
            {!isEmpty && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PROMPT_CHIPS.slice(0, 4).map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => handleSend(chip.prompt)}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="px-4 py-3 border-t bg-background shrink-0">
          <form
            onSubmit={e => { e.preventDefault(); handleSend() }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                cooldownLeft > 0
                  ? `${cooldownLeft}초 후 다시 입력 가능합니다`
                  : '예) 아이 선물로 좋은 과일 추천해줘'
              }
              disabled={loading || cooldownLeft > 0}
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading || cooldownLeft > 0}
              size="sm"
              className="shrink-0"
            >
              전송
            </Button>
          </form>
          {!hasApiKey() && (
            <p className="text-[10px] text-muted-foreground mt-1.5">
              AI 추천을 사용하려면 VITE_ANTHROPIC_API_KEY를 설정하세요.
            </p>
          )}
        </div>

      </SheetContent>
    </Sheet>
  )
}
