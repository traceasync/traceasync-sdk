import { AsyncLocalStorage } from 'async_hooks'

export type TraceStep = {
  name: string
  startTime: number
  endTime?: number
  error?: string
}

export type TraceContext = {
  runId: string
  runName: string
  startTime: number
  steps: TraceStep[]
}

export const traceStorage = new AsyncLocalStorage<TraceContext>()
