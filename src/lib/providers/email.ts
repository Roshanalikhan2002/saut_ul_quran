/**
 * Email provider abstraction.
 * Free-tier default: console/noop — logs payloads in development, no network send.
 * Replace with Resend/SendGrid/Supabase Edge Function when ready.
 */

export interface EmailMessage {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ ok: boolean; id?: string }>
}

export const consoleEmailProvider: EmailProvider = {
  async send(message) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[email:noop]', message)
    }
    return { ok: true, id: `noop-${Date.now()}` }
  },
}

/** Active provider — swap for a real SMTP/API implementation. */
export const emailProvider: EmailProvider = consoleEmailProvider
