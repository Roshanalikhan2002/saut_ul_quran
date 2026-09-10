import type { HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: ReactNode
}

function StatCard({
  className,
  title,
  value,
  description,
  icon: Icon,
  trend,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? (
          <Icon className="h-4 w-4 text-secondary" aria-hidden />
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="font-display text-2xl font-semibold text-foreground">
          {value}
        </div>
        {description || trend ? (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {trend}
            {description ? <span>{description}</span> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export { StatCard }
