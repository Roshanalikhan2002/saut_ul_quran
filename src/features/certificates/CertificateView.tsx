import { JAMIA_NAME, APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CertificateWithDetails } from '@/services/certificates'
import { pickCourseTitle } from '@/services/courses'
import type { AppLocale } from '@/types/database'

export interface CertificateViewProps {
  certificate: CertificateWithDetails
  locale?: AppLocale
  jamiaName?: string
  className?: string
  /** Extra class applied only when printing */
  printId?: string
}

/**
 * Print-friendly Islamic certificate (navy / gold).
 * Use window.print() with a @media print stylesheet that hides chrome.
 */
export function CertificateView({
  certificate,
  locale = 'en',
  jamiaName = JAMIA_NAME,
  className,
  printId = 'certificate-print-root',
}: CertificateViewProps) {
  const studentName =
    (locale === 'ur'
      ? certificate.profiles?.full_name_ur
      : null) ||
    certificate.profiles?.full_name ||
    '—'

  const courseTitle = certificate.courses
    ? pickCourseTitle(
        {
          ...certificate.courses,
          course_translations: certificate.courses.course_translations ?? [],
        },
        locale,
      )
    : '—'

  const issued =
    certificate.issued_at != null
      ? new Date(certificate.issued_at).toLocaleDateString(
          locale === 'ur' ? 'ur-PK' : 'en-GB',
          { year: 'numeric', month: 'long', day: 'numeric' },
        )
      : '—'

  return (
    <article
      id={printId}
      className={cn(
        'certificate-sheet relative mx-auto aspect-[1.414/1] w-full max-w-3xl overflow-hidden border-[6px] border-double border-[#c9a227] bg-[#faf7f0] text-[#0b1f3a] shadow-lg',
        className,
      )}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.12), transparent 55%), linear-gradient(180deg, #faf7f0 0%, #f3efe4 100%)',
      }}
    >
      {/* Corner ornaments */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 border border-[#c9a227]/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-5 border border-[#0b1f3a]/15"
      />

      <div className="relative flex h-full flex-col items-center justify-between px-8 py-8 text-center sm:px-12 sm:py-10">
        <header className="space-y-1">
          <p className="font-display text-xs font-semibold tracking-[0.25em] text-[#c9a227] uppercase">
            {APP_NAME}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#0b1f3a] sm:text-3xl">
            {jamiaName}
          </h1>
          <p className="text-sm text-[#0b1f3a]/70">
            Certificate of Completion
          </p>
          <div className="mx-auto mt-2 h-px w-32 bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
        </header>

        <div className="my-4 space-y-3 sm:my-6">
          <p className="text-sm italic text-[#0b1f3a]/75">
            This is to certify that
          </p>
          <p className="font-display text-2xl font-semibold text-[#0b1f3a] sm:text-3xl">
            {studentName}
          </p>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[#0b1f3a]/80">
            has successfully completed the course
          </p>
          <p className="font-display text-xl font-semibold text-[#c9a227] sm:text-2xl">
            {courseTitle}
          </p>
        </div>

        <footer className="grid w-full grid-cols-1 gap-4 text-xs sm:grid-cols-3 sm:gap-6 sm:text-sm">
          <div>
            <p className="text-[#0b1f3a]/55">Date</p>
            <p className="mt-1 font-medium">{issued}</p>
          </div>
          <div>
            <p className="text-[#0b1f3a]/55">Certificate ID</p>
            <p className="mt-1 font-mono text-[11px] font-medium tracking-wide sm:text-xs">
              {certificate.certificate_number}
            </p>
          </div>
          <div>
            <p className="text-[#0b1f3a]/55">Status</p>
            <p className="mt-1 font-medium capitalize">{certificate.status}</p>
          </div>
        </footer>

        <p
          className="mt-4 font-display text-lg text-[#0b1f3a]/40"
          dir="rtl"
          lang="ar"
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>
      </div>
    </article>
  )
}

/** Trigger browser print for the certificate sheet. */
export function printCertificate(elementId = 'certificate-print-root') {
  const node = document.getElementById(elementId)
  if (!node) {
    window.print()
    return
  }
  document.body.classList.add('printing-certificate')
  window.print()
  window.setTimeout(() => {
    document.body.classList.remove('printing-certificate')
  }, 500)
}
