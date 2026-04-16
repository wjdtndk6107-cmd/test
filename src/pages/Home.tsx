import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Gonggu } from '@/types'
import GongguCard from '@/components/GongguCard'
import AiAssistantDrawer from '@/components/AiAssistantDrawer'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PROMPT_CHIPS } from '@/features/ai/prompts'

function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-2 w-full" />
    </div>
  )
}

export default function Home() {
  const [gonggus, setGonggus] = useState<Gonggu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')

  useEffect(() => {
    async function fetchGonggus() {
      const { data, error } = await supabase
        .from('gonggu')
        .select('*, products(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setError('공구 목록을 불러오는 중 오류가 발생했습니다.')
      } else {
        setGonggus(data as Gonggu[])
      }
      setLoading(false)
    }
    fetchGonggus()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return gonggus
    const q = search.toLowerCase()
    return gonggus.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.products?.name?.toLowerCase().includes(q) ||
      g.products?.description?.toLowerCase().includes(q)
    )
  }, [gonggus, search])

  function openAiWith(prompt: string) {
    setAiPrompt(prompt)
    setDrawerOpen(true)
  }

  return (
    <div className="max-w-5xl mx-auto px-4">

      {/* ── Hero banner ── */}
      <section className="py-10 md:py-14">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">
            소상공인 직접 기획
          </p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-3">
            신선한 산지 직송,<br />특가 공구로 만나보세요
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            원하는 조건을 AI에게 말하면 딱 맞는 공구를 골라드려요.
          </p>

          {/* Search bar */}
          <div className="relative mb-5">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="상품명으로 검색..."
              className="pl-4 pr-10 h-11 text-sm shadow-sm border-border/80"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                onClick={() => setSearch('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Prompt chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {PROMPT_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => openAiWith(chip.prompt)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-white hover:bg-muted hover:border-primary/50 transition-colors font-medium shadow-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* AI CTA */}
          <Button
            onClick={() => { setAiPrompt(''); setDrawerOpen(true) }}
            className="gap-2 rounded-full px-5"
          >
            <span className="text-base leading-none">✦</span>
            AI로 공구 추천받기
          </Button>
        </div>
      </section>

      {/* ── Gonggu grid ── */}
      <section className="pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">
            {search ? `"${search}" 검색 결과` : '진행 중인 공구'}
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {filtered.length}개
              </span>
            )}
          </h2>
        </div>

        {error && (
          <p className="text-center py-16 text-destructive text-sm">{error}</p>
        )}

        {!error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
              : filtered.length === 0
              ? (
                <div className="col-span-full text-center py-16 space-y-3">
                  <p className="text-muted-foreground">
                    {search ? '검색 결과가 없어요.' : '진행 중인 공구가 없습니다.'}
                  </p>
                  {search && (
                    <Button variant="outline" size="sm" onClick={() => openAiWith(`${search} 관련 공구 추천해줘`)}>
                      AI에게 "{search}" 추천 요청하기
                    </Button>
                  )}
                </div>
              )
              : filtered.map(g => <GongguCard key={g.id} gonggu={g} />)
            }
          </div>
        )}
      </section>

      {/* AI Drawer */}
      <AiAssistantDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        gonggus={gonggus}
        initialPrompt={aiPrompt || undefined}
      />
    </div>
  )
}
