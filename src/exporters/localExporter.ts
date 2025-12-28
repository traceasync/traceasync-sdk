import { TraceContext } from '../context'

export const exportLocal = (ctx: TraceContext) => {
  const durationMs = Date.now() - ctx.startTime

  console.log(
    JSON.stringify(
      {
        run: ctx.runName,
        runId: ctx.runId,
        status: ctx.steps.some(s => s.error) ? 'error' : 'success',
        durationMs,
        steps: ctx.steps.map(s => ({
          name: s.name,
          durationMs: (s.endTime ?? Date.now()) - s.startTime,
          error: s.error,
        })),
      },
      null,
      2,
    ),
  )
}
