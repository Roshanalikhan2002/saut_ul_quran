import type { HTMLAttributes } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  retryLabel?: string
  onRetry?: () => void
}

function ErrorState({
  className,
  title,
  description,
  retryLabel,
  onRetry,
  ...props
}: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
      role="alert"
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {title ?? t('errorState.title')}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {description ?? t('errorState.description')}
        </p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          {retryLabel ?? t('errorState.retry')}
        </Button>
      ) : null}
    </div>
  )
}

export { ErrorState }
