import { useTranslation } from 'react-i18next'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusKey =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'published'
  | 'archived'
  | 'completed'
  | 'inProgress'
  | 'cancelled'
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'
  | 'liveNow'
  | 'scheduled'
  | 'ended'

const STATUS_VARIANT: Record<StatusKey, BadgeProps['variant']> = {
  active: 'success',
  inactive: 'outline',
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  draft: 'outline',
  published: 'secondary',
  archived: 'outline',
  completed: 'success',
  inProgress: 'secondary',
  cancelled: 'destructive',
  present: 'success',
  absent: 'destructive',
  late: 'warning',
  excused: 'outline',
  liveNow: 'destructive',
  scheduled: 'secondary',
  ended: 'outline',
}

const STATUS_LABEL_KEY: Record<StatusKey, string> = {
  active: 'common.status.active',
  inactive: 'common.status.inactive',
  pending: 'common.status.pending',
  approved: 'common.status.approved',
  rejected: 'common.status.rejected',
  draft: 'common.status.draft',
  published: 'common.status.published',
  archived: 'common.status.archived',
  completed: 'common.status.completed',
  inProgress: 'common.status.inProgress',
  cancelled: 'common.status.cancelled',
  present: 'attendance.present',
  absent: 'attendance.absent',
  late: 'attendance.late',
  excused: 'attendance.excused',
  liveNow: 'live.liveNow',
  scheduled: 'live.scheduled',
  ended: 'live.ended',
}

interface StatusBadgeProps {
  status: StatusKey | string
  className?: string
  label?: string
}

function StatusBadge({ status, className, label }: StatusBadgeProps) {
  const { t } = useTranslation()
  const key = status as StatusKey
  const variant = STATUS_VARIANT[key] ?? 'outline'
  const text =
    label ??
    (STATUS_LABEL_KEY[key] ? t(STATUS_LABEL_KEY[key]) : status)

  return (
    <Badge variant={variant} className={cn(className)}>
      {text}
    </Badge>
  )
}

export { StatusBadge }
export type { StatusKey }
