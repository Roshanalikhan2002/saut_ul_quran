import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Award, CheckCircle2, XCircle } from 'lucide-react'
import {
  verifyCertificate,
  type PublicCertificateInfo,
} from '@/services/certificates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/ui/loading-state'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { JAMIA_NAME } from '@/lib/constants'

export function CertificateVerifyPage() {
  const { code: routeCode = '' } = useParams()
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ur' ? 'ur' : 'en'

  const [code, setCode] = useState(routeCode)
  const [loading, setLoading] = useState(Boolean(routeCode))
  const [valid, setValid] = useState<boolean | null>(null)
  const [certificate, setCertificate] = useState<PublicCertificateInfo | null>(
    null,
  )

  const runVerify = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setValid(null)
      setCertificate(null)
      return
    }
    setLoading(true)
    try {
      const result = await verifyCertificate(trimmed)
      setValid(result.valid)
      setCertificate(result.certificate)
    } catch {
      setValid(false)
      setCertificate(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (routeCode) {
      setCode(routeCode)
      void runVerify(routeCode)
    }
  }, [routeCode, runVerify])

  const studentName =
    locale === 'ur'
      ? certificate?.student_name_ur || certificate?.student_name
      : certificate?.student_name || certificate?.student_name_ur

  const courseTitle =
    locale === 'ur'
      ? certificate?.course_title_ur || certificate?.course_title_en
      : certificate?.course_title_en || certificate?.course_title_ur

  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{JAMIA_NAME}</p>
        <h1 className="font-display text-3xl font-semibold text-navy">
          {t('verify.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('verify.subtitle')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('certificates.certificateId')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cert-code">{t('verify.placeholder')}</Label>
            <div className="flex gap-2">
              <Input
                id="cert-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUQ-…"
              />
              <Button
                type="button"
                onClick={() => void runVerify(code)}
                disabled={loading}
              >
                {t('verify.action')}
              </Button>
            </div>
          </div>

          {loading ? <LoadingState /> : null}

          {!loading && valid === true && certificate ? (
            <div className="space-y-3 rounded-lg border border-border bg-surface/60 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{t('verify.valid')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Award className="mt-0.5 h-5 w-5 text-secondary" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-navy">
                    {studentName || t('common.unknown')}
                  </p>
                  <p className="text-muted-foreground">
                    {courseTitle || t('nav.courses')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {certificate.certificate_number}
                    {certificate.issued_at
                      ? ` · ${new Date(certificate.issued_at).toLocaleDateString()}`
                      : ''}
                  </p>
                  <Badge variant="secondary">{certificate.status}</Badge>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && valid === false ? (
            <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>{t('verify.invalid')}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
