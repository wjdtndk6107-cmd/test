import { Progress } from '@/components/ui/progress'

interface ProgressBarProps {
  current: number
  target: number
}

export default function ProgressBar({ current, target }: ProgressBarProps) {
  const percent = Math.min(Math.round((current / target) * 100), 100)

  let indicatorClass = 'bg-zinc-400'
  if (percent >= 80) indicatorClass = 'bg-green-500'
  else if (percent >= 50) indicatorClass = 'bg-orange-400'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{current}명 참여</span>
        <span>{percent}% 달성</span>
      </div>
      <Progress value={percent} className="h-2 [&>div]:transition-all" indicatorClassName={indicatorClass} />
      <p className="text-xs text-muted-foreground">목표: {target}명</p>
    </div>
  )
}
