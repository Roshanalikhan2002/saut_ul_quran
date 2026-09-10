import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercent(value: number) {
  if (Number.isNaN(value)) return '0%'
  return `${Math.round(value)}%`
}

export function publicAssetUrl(path?: string | null) {
  return path || '/logo.svg'
}
