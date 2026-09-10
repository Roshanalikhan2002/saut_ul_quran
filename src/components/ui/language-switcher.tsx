import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LOCALES, type AppLocale } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

function LanguageSwitcher({
  className,
  variant = 'outline',
  size = 'sm',
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const current = (LOCALES.includes(i18n.language as AppLocale)
    ? i18n.language
    : 'en') as AppLocale

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn(className)}
          aria-label={t('language.switchTo')}
        >
          <Languages className="h-4 w-4" />
          <span className={size === 'icon' ? 'sr-only' : undefined}>
            {t(`language.${current}`)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            void i18n.changeLanguage(value)
          }}
        >
          {LOCALES.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale}>
              {t(`language.${locale}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { LanguageSwitcher }
