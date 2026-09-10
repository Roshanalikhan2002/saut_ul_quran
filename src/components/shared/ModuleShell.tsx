import type { ReactNode } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorState } from '@/components/ui/error-state'
import { toError } from '@/lib/errors'

interface ModuleShellProps {
  title: string
  description?: string
  actions?: ReactNode
  loading?: boolean
  error?: Error | unknown | null
  onRetry?: () => void
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  children?: ReactNode
}

/** Thin feature page shell: header + loading / error / empty / content. */
export function ModuleShell({
  title,
  description,
  actions,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle,
  emptyDescription,
  children,
}: ModuleShellProps) {
  const resolvedError = error != null ? toError(error) : null

  return (
    <div className="min-w-0 max-w-full">
      <PageHeader title={title} description={description} actions={actions} />
      {loading ? <LoadingState /> : null}
      {!loading && resolvedError ? (
        <ErrorState
          description={resolvedError.message}
          onRetry={onRetry}
        />
      ) : null}
      {!loading && !resolvedError && empty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}
      {!loading && !resolvedError && !empty ? (
        <div className="min-w-0 max-w-full">{children}</div>
      ) : null}
    </div>
  )
}
