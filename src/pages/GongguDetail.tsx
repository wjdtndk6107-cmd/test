import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Gonggu } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import ProgressBar from '@/components/ProgressBar'
import OrderForm from '@/components/OrderForm'

function getDday(deadline: string) {
  const diff = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff < 0) return '마감됨'
  if (diff === 0) return '오늘 마감'
  return `${diff}일 남음`
}

export default function GongguDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [gonggu, setGonggu] = useState<Gonggu | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGonggu() {
      const { data, error } = await supabase
        .from('gonggu')
        .select('*, products(*)')
        .eq('id', id)
        .single()

      if (error) {
        console.error(error)
        navigate('/')
      } else {
        setGonggu(data as Gonggu)
      }
      setLoading(false)
    }
    fetchGonggu()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    )
  }

  if (!gonggu) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/')}>
        ← 목록으로
      </Button>

      {gonggu.products?.image_url ? (
        <img
          src={gonggu.products.image_url}
          alt={gonggu.products.name}
          className="w-full h-64 object-cover rounded-xl mb-6"
        />
      ) : (
        <div className="w-full h-64 bg-muted rounded-xl flex items-center justify-center text-muted-foreground mb-6">
          이미지 없음
        </div>
      )}

      <div className="space-y-4 mb-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold">{gonggu.title}</h1>
          <Badge variant={gonggu.status === 'open' ? 'default' : 'secondary'}>
            {getDday(gonggu.deadline)}
          </Badge>
        </div>

        {gonggu.products?.description && (
          <p className="text-sm text-muted-foreground">{gonggu.products.description}</p>
        )}

        <p className="text-2xl font-bold">{gonggu.sale_price.toLocaleString()}원</p>

        <ProgressBar current={gonggu.current_quantity} target={gonggu.min_quantity} />
      </div>

      <Separator className="mb-6" />

      {gonggu.status === 'open' ? (
        <Card>
          <CardContent className="pt-6">
            <OrderForm gongguId={gonggu.id} salePrice={gonggu.sale_price} />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 bg-muted rounded-xl text-muted-foreground">
          이 공구는 마감됐습니다.
        </div>
      )}
    </div>
  )
}
