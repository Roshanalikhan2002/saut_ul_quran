import { useCallback, useEffect, useRef, useState } from 'react'
import { toError } from '@/lib/errors'

interface AsyncState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

interface UseAsyncOptions {
  immediate?: boolean
}

function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = {},
) {
  const { immediate = false } = options
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: immediate,
  })
  const mountedRef = useRef(true)
  const asyncFnRef = useRef(asyncFn)
  asyncFnRef.current = asyncFn

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async (...args: Args) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await asyncFnRef.current(...args)
      if (mountedRef.current) {
        setState({ data, error: null, loading: false })
      }
      return data
    } catch (err) {
      const error = toError(err)
      if (mountedRef.current) {
        setState({ data: null, error, loading: false })
      }
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false })
  }, [])

  useEffect(() => {
    if (!immediate) return
    void execute(...([] as unknown as Args)).catch(() => undefined)
  }, [immediate, execute])

  return {
    ...state,
    execute,
    reset,
    setData: (data: T | null) =>
      setState((prev) => ({ ...prev, data })),
  }
}

export { useAsync }
