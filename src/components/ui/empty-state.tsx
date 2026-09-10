import type { HTMLAttributes, ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

function EmptyState({
  className,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  ...props
}: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden />}
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {title ?? t('emptyState.title')}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {description ?? t('emptyState.description')}
        </p>
      </div>
      {onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel ?? t('emptyState.action')}
        </Button>
      ) : null}
    </div>
  )
}

export { EmptyState }
