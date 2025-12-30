import { TraceContext } from '../context';

export const exportLocal = (ctx: TraceContext) => {
  const now = Date.now();
  const durationMs = now - ctx.startTime;
  const status = ctx.steps.some((s) => s.error) ? 'error' : 'success';

  console.log(
    JSON.stringify(
      {
        service: ctx.service,

        trace: ctx.traceName,
        traceId: ctx.traceId,

        span: ctx.spanName,
        spanId: ctx.spanId,
        parentSpanId: ctx.parentSpanId ?? null,

        status,
        durationMs,

        steps: ctx.steps.map((s) => ({
          name: s.name,
          durationMs: (s.endTime ?? now) - s.startTime,
          ...(s.error ? { error: s.error } : {}),
        })),
      },
      null,
      2
    )
  );
};
