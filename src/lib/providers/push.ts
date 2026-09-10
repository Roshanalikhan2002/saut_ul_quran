/**
 * Push notification provider abstraction.
 * Free-tier default: noop — accepts payloads without delivering.
 * Replace with FCM/OneSignal/web-push when credentials are available.
 */

export interface PushPayload {
  userIds: string[]
  title: string
  body: string
  data?: Record<string, string>
}

export interface PushProvider {
  send(payload: PushPayload): Promise<{ ok: boolean; delivered: number }>
}

export const noopPushProvider: PushProvider = {
  async send(payload) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[push:noop]', payload)
    }
    return { ok: true, delivered: 0 }
  },
}

/** Active provider — swap for FCM/web-push when configured. */
export const pushProvider: PushProvider = noopPushProvider
