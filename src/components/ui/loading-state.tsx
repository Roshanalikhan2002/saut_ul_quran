import type { HTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  variant?: 'spinner' | 'skeleton'
  skeletonCount?: number
}

function LoadingState({
  className,
  title,
  description,
  variant = 'spinner',
  skeletonCount = 3,
  ...props
}: LoadingStateProps) {
  const { t } = useTranslation()

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)} {...props}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium text-foreground">
          {title ?? t('loadingState.title')}
        </p>
        <p className="text-sm text-muted-foreground">
          {description ?? t('loadingState.description')}
        </p>
      </div>
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}

export { LoadingState }
