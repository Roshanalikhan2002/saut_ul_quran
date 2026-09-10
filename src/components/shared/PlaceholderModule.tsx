import { useTranslation } from 'react-i18next'
import { ModuleShell } from '@/components/shared/ModuleShell'
import { EmptyState } from '@/components/ui/empty-state'

interface PlaceholderModuleProps {
  titleKey: string
  descriptionKey?: string
}

/** Shared placeholder for modules pending full feature implementation. */
export function PlaceholderModule({
  titleKey,
  descriptionKey,
}: PlaceholderModuleProps) {
  const { t } = useTranslation()
  return (
    <ModuleShell
      title={t(titleKey)}
      description={descriptionKey ? t(descriptionKey) : undefined}
    >
      <EmptyState
        title={t('loadingState.title')}
        description={t('common.loadingData')}
      />
    </ModuleShell>
  )
}
