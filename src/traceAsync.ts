import { randomUUID } from 'crypto'
import { traceStorage, TraceContext, TraceStep } from './context'
import { exportLocal } from './exporters/localExporter'

type InitConfig = {
  service: string
  mode: 'local' | 'cloud'
}

let config: InitConfig | undefined

export const traceAsync = {
  init(cfg: InitConfig) {
    config = cfg
  },

  lambda<T extends (...args: any[]) => any>(
    name: string,
    handler: T,
  ): T {
    return (async (...args: any[]) => {
      const ctx: TraceContext = {
        runId: randomUUID(),
        runName: name,
        startTime: Date.now(),
        steps: [],
      }

      return traceStorage.run(ctx, async () => {
        try {
          const result = await handler(...args)
          exportLocal(ctx)
          return result
        } catch (err: any) {
          ctx.steps.push({
            name: 'handler.error',
            startTime: Date.now(),
            endTime: Date.now(),
            error: err?.message ?? String(err),
          })
          exportLocal(ctx)
          throw err
        }
      })
    }) as T
  },

  async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const ctx = traceStorage.getStore()
    if (!ctx) return fn()

    const step: TraceStep = {
      name,
      startTime: Date.now(),
    }

    ctx.steps.push(step)

    try {
      const result = await fn()
      step.endTime = Date.now()
      return result
    } catch (err: any) {
      step.endTime = Date.now()
      step.error = err?.message ?? String(err)
      throw err
    }
  },
}
