/**
 * Human-readable error messages for UI.
 * Never surfaces "[object Object]".
 */

const FRIENDLY_FALLBACKS: Array<{ test: RegExp; message: string }> = [
  {
    test: /failed to fetch|networkerror|network request failed|fetch/i,
    message: 'Unable to reach the server. Check your connection and try again.',
  },
  {
    test: /jwt|not authenticated|invalid claim|session/i,
    message: 'Your session expired. Please sign in again.',
  },
  {
    test: /row-level security|rls|permission denied|not authorized|42501/i,
    message: 'You do not have permission to perform this action.',
  },
  {
    test: /duplicate|unique constraint|already exists|23505/i,
    message: 'This record already exists.',
  },
  {
    test: /foreign key|23503/i,
    message: 'Related data is missing or was deleted.',
  },
  {
    test: /bucket|storage|mime|file size|too large/i,
    message: 'File upload failed. Check the file type and size, then try again.',
  },
  {
    test: /invalid login|invalid credentials|email not confirmed/i,
    message: 'Invalid email or password.',
  },
]

export function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'string' && err.trim()) return new Error(err)
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>
    const parts = [o.message, o.error_description, o.details, o.hint, o.error]
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    if (parts.length) return new Error(parts.join(' — '))
    try {
      const json = JSON.stringify(err)
      if (json && json !== '{}' && json !== 'null') return new Error(json)
    } catch {
      /* ignore */
    }
  }
  return new Error('Something went wrong. Please try again.')
}

/** Message safe to show in toasts / ErrorState. */
export function getErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const message = toError(err).message.trim()
  if (!message || message === '[object Object]') return fallback
  for (const rule of FRIENDLY_FALLBACKS) {
    if (rule.test.test(message)) return rule.message
  }
  return message
}

/** Domain-specific friendly wrappers. */
export function coursesLoadError(err: unknown): Error {
  return new Error(
    getErrorMessage(err, 'Unable to load courses. Please try again.'),
  )
}

export function saveError(err: unknown, entity = 'data'): Error {
  return new Error(
    getErrorMessage(err, `Unable to save ${entity}. Please try again.`),
  )
}
