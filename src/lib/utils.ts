import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirection(language: 'ar' | 'en') {
  return language === 'ar' ? 'rtl' : 'ltr'
}

export function formatDate(date: string | Date, locale: 'ar' | 'en' = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function truncateText(text: string, maxLength: number = 100) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}