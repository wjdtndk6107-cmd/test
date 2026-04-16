import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Gonggu } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import ProgressBar from '@/components/ProgressBar'

const STATUS_MAP = {
  open: { label: '진행중', variant: 'default' as const },
  closed: { label: '마감', variant: 'secondary' as const },
  cancelled: { label: '취소', variant: 'destructive' as const },
}

export default function SellerDashboard() {
  const navigate = useNavigate()
  const [gonggus, setGonggus] = useState<Gonggu[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const email = prompt('소상공인 이메일을 입력하세요:') ?? ''
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) {
          alert('로그인 요청 중 오류가 발생했습니다.')
        } else {
          alert('이메일로 로그인 링크를 발송했습니다. 확인 후 다시 접속해주세요.')
        }
        setLoading(false)
        return
      }

      setUserEmail(user.email ?? null)

      const { data, error } = await supabase
        .from('gonggu')
        .select('*, products(*)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setGonggus(data as Gonggu[])
      }
      setLoading(false)
    }
    init()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">소상공인 대시보드</h1>
          {userEmail && <p className="text-sm text-muted-foreground mt-0.5">{userEmail}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/seller/create')}>+ 공구 개설</Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>로그아웃</Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {gonggus.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <p>개설한 공구가 없습니다.</p>
          <Button variant="outline" onClick={() => navigate('/seller/create')}>
            첫 번째 공구 개설하기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {gonggus.map(g => {
            const status = STATUS_MAP[g.status]
            return (
              <Card key={g.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-base">{g.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{g.products?.name}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span>판매가 <strong className="text-foreground">{g.sale_price.toLocaleString()}원</strong></span>
                    <span>·</span>
                    <span>마감 <strong className="text-foreground">{new Date(g.deadline).toLocaleDateString('ko-KR')}</strong></span>
                  </div>
                  <ProgressBar current={g.current_quantity} target={g.min_quantity} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
