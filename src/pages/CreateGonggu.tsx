import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

export default function CreateGonggu() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [title, setTitle] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [minQuantity, setMinQuantity] = useState('10')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다.')
        navigate('/seller')
        return
      }
      setUserId(user.id)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setProducts(data as Product[])
      }
    }
    init()
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !productId) {
      toast({ title: '상품을 선택해주세요.', variant: 'destructive' })
      return
    }

    setLoading(true)
    const { error } = await supabase.from('gonggu').insert({
      seller_id: userId,
      product_id: productId,
      title: title.trim(),
      sale_price: Number(salePrice),
      min_quantity: Number(minQuantity),
      deadline: new Date(deadline).toISOString(),
      status: 'open',
    })
    setLoading(false)

    if (error) {
      console.error(error)
      toast({ title: '오류', description: '공구 개설 중 문제가 발생했습니다.', variant: 'destructive' })
      return
    }

    toast({ title: '공구가 개설됐습니다!' })
    navigate('/seller')
  }

  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => navigate('/seller')}>
        ← 대시보드로
      </Button>

      <h1 className="text-2xl font-bold mb-6">공구 개설하기</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">공구 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="product">상품 선택</Label>
              <Select value={productId} onValueChange={setProductId} required>
                <SelectTrigger id="product">
                  <SelectValue placeholder="상품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (도매가: {p.wholesale_price.toLocaleString()}원)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">공구 제목</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예) 신선한 제주 감귤 공동구매"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="salePrice">판매가 (원)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  min={1}
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  placeholder="15000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minQty">최소 수량 (명)</Label>
                <Input
                  id="minQty"
                  type="number"
                  min={1}
                  value={minQuantity}
                  onChange={e => setMinQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">마감일시</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                min={minDate}
                onChange={e => setDeadline(e.target.value)}
                required
              />
            </div>

            <Separator />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '개설 중...' : '공구 개설하기'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
