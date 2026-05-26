// src/utils/imageHelpers.ts
export const bustCache = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}t=${Date.now()}`
}
