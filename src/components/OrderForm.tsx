import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface OrderFormProps {
  gongguId: string
  salePrice: number
}

export default function OrderForm({ gongguId, salePrice }: OrderFormProps) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const totalPrice = salePrice * quantity

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('orders').insert({
      gonggu_id: gongguId,
      consumer_name: name.trim(),
      consumer_phone: phone.trim(),
      quantity,
      total_price: totalPrice,
    })
    setLoading(false)

    if (error) {
      console.error(error)
      toast({ title: '오류', description: '주문 중 문제가 발생했습니다.', variant: 'destructive' })
      return
    }

    setDone(true)
    toast({ title: '주문 완료!', description: '공구에 참여해주셔서 감사합니다.' })
  }

  if (done) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-2xl">🎉</p>
        <p className="font-semibold text-green-600 text-lg">주문이 완료됐습니다!</p>
        <p className="text-sm text-muted-foreground">참여해주셔서 감사합니다.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-bold text-lg">주문하기</h3>
      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="홍길동"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">전화번호</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="010-0000-0000"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="quantity">수량</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
        />
      </div>

      <Separator />

      <div className="flex justify-between items-center py-1">
        <span className="text-sm text-muted-foreground">결제 예정 금액</span>
        <span className="text-lg font-bold">{totalPrice.toLocaleString()}원</span>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '주문 중...' : '공구 참여하기'}
      </Button>
    </form>
  )
}
