import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchAboutJamia,
  updateAboutJamia,
  type JamiaAbout,
} from '@/features/about/aboutService'
import { cn } from '@/lib/utils'

type AboutEditorProps = {
  className?: string
  onSaved?: (jamia: JamiaAbout) => void
}

function AboutEditor({ className, onSaved }: AboutEditorProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<JamiaAbout | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchAboutJamia().then((data) => {
      if (!cancelled) setForm(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function setField<K extends keyof JamiaAbout>(key: K, value: JamiaAbout[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const saved = await updateAboutJamia(form)
      setForm(saved)
      setMessage(t('common.successSaved'))
      onSaved?.(saved)
    } catch {
      setError(t('common.errorRetry'))
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return (
      <p className={cn('text-sm text-muted', className)}>{t('common.loading')}</p>
    )
  }

  const fields: {
    key: keyof JamiaAbout
    label: string
    multiline?: boolean
  }[] = [
    { key: 'nameEn', label: 'Name (English)' },
    { key: 'nameUr', label: 'Name (Urdu)' },
    { key: 'locationEn', label: 'Location (English)', multiline: true },
    { key: 'locationUr', label: 'Location (Urdu)', multiline: true },
    { key: 'headUstazahEn', label: 'Head Ustazah (English)' },
    { key: 'headUstazahUr', label: 'Head Ustazah (Urdu)' },
    { key: 'missionEn', label: 'Mission (English)', multiline: true },
    { key: 'missionUr', label: 'Mission (Urdu)', multiline: true },
    { key: 'phone', label: 'Phone / WhatsApp' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
    { key: 'logoUrl', label: 'Logo URL' },
  ]

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-5', className)}
      noValidate
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-navy">
          {t('about.title')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('about.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const value = form[field.key]
          const id = `about-${field.key}`
          const stringValue =
            value === null || value === undefined ? '' : String(value)

          return (
            <div
              key={field.key}
              className={cn(field.multiline && 'sm:col-span-2')}
            >
              <Label htmlFor={id}>{field.label}</Label>
              {field.multiline ? (
                <Textarea
                  id={id}
                  className="mt-1.5"
                  rows={3}
                  value={stringValue}
                  onChange={(e) =>
                    setField(field.key, e.target.value as JamiaAbout[typeof field.key])
                  }
                />
              ) : (
                <Input
                  id={id}
                  className="mt-1.5"
                  value={stringValue}
                  onChange={(e) => {
                    const next =
                      field.key === 'phone' ||
                      field.key === 'email' ||
                      field.key === 'website' ||
                      field.key === 'logoUrl'
                        ? e.target.value || null
                        : e.target.value
                    setField(field.key, next as JamiaAbout[typeof field.key])
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {message ? (
        <p className="text-sm text-navy" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" disabled={saving}>
        {saving ? t('common.pleaseWait') : t('common.actions.save')}
      </Button>
    </form>
  )
}

export { AboutEditor }
