// src/utils/logHelpers.ts
export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface LogEntry {
  id: string
  level: LogLevel
  timestamp: string
  message: string
}

export const createLog = (level: LogLevel, message: string): LogEntry => ({
  id: crypto.randomUUID(),
  level,
  timestamp: new Date().toLocaleTimeString(),
  message,
})
