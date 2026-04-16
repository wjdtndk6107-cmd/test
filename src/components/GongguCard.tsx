import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Gonggu } from '@/types'
import ProgressBar from './ProgressBar'

interface GongguCardProps {
  gonggu: Gonggu
}

function getDday(deadline: string) {
  const diff = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff < 0) return '마감'
  if (diff === 0) return 'D-Day'
  return `D-${diff}`
}

export default function GongguCard({ gonggu }: GongguCardProps) {
  const navigate = useNavigate()
  const dday = getDday(gonggu.deadline)
  const isClosed = dday === '마감'

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      onClick={() => navigate(`/gonggu/${gonggu.id}`)}
    >
      {gonggu.products?.image_url ? (
        <img
          src={gonggu.products.image_url}
          alt={gonggu.products.name}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div className="w-full h-44 bg-muted flex items-center justify-center text-muted-foreground text-sm">
          이미지 없음
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <p className="font-semibold text-sm leading-snug flex-1">{gonggu.title}</p>
          <Badge variant={isClosed ? 'secondary' : 'destructive'} className="shrink-0">
            {dday}
          </Badge>
        </div>

        <p className="text-lg font-bold text-primary">
          {gonggu.sale_price.toLocaleString()}원
        </p>

        <ProgressBar current={gonggu.current_quantity} target={gonggu.min_quantity} />
      </CardContent>
    </Card>
  )
}
