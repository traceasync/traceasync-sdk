import { randomUUID } from 'crypto';
import { TraceContext, TraceStep, traceStorage } from './context';
import { exportLocal } from './exporters/localExporter';

const TRACE_PAYLOAD_KEY = '_traceasync' as const;

export type TracePayload = {
  v: 1;
  traceId: string;
  traceName: string;
  parentSpanId: string;
};

type InitConfig = {
  service: string;
  mode: 'local' | 'cloud';
};
let config: InitConfig | undefined;

type WithTrace<T extends Record<string, any>> = T & {
  [TRACE_PAYLOAD_KEY]?: TracePayload;
};

const getService = () => config?.service ?? 'unknown';

export const traceAsync = {
  init(cfg: InitConfig) {
    config = cfg;
  },

  lambda<T extends (...args: any[]) => any>(spanName: string, handler: T): T {
    return (async (...args: any[]) => {
      const ctx: TraceContext = {
        service: getService(),
        traceId: randomUUID(),
        spanId: randomUUID(),
        traceName: spanName,
        spanName,
        startTime: Date.now(),
        steps: [],
      };

      return traceStorage.run(ctx, async () => {
        try {
          const result = await handler(...args);
          exportLocal(ctx);
          return result;
        } catch (err: any) {
          ctx.steps.push({
            name: 'handler.error',
            startTime: Date.now(),
            endTime: Date.now(),
            error: err?.message ?? String(err),
          });
          exportLocal(ctx);
          throw err;
        }
      });
    }) as T;
  },

  async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const ctx = traceStorage.getStore();
    if (!ctx) return fn();

    const step: TraceStep = { name, startTime: Date.now() };
    ctx.steps.push(step);

    try {
      const result = await fn();
      step.endTime = Date.now();
      return result;
    } catch (err: any) {
      step.endTime = Date.now();
      step.error = err?.message ?? String(err);
      throw err;
    }
  },

  propagate<T extends Record<string, any>>(payload?: T): WithTrace<T> {
    const ctx = traceStorage.getStore();
    if (!ctx) return (payload ?? ({} as T)) as WithTrace<T>;

    return {
      ...(payload ?? ({} as T)),
      [TRACE_PAYLOAD_KEY]: {
        v: 1,
        traceId: ctx.traceId,
        traceName: ctx.traceName,
        parentSpanId: ctx.spanId,
      },
    };
  },

  async resume<T>(
    payload: any,
    spanName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const trace: TracePayload | undefined = payload?.[TRACE_PAYLOAD_KEY];
    if (!trace) return fn();

    const ctx: TraceContext = {
      service: getService(),
      traceId: trace.traceId,
      spanId: randomUUID(),
      parentSpanId: trace.parentSpanId,
      traceName: trace.traceName,
      spanName,
      startTime: Date.now(),
      steps: [],
    };

    return traceStorage.run(ctx, async () => {
      try {
        const result = await fn();
        exportLocal(ctx);
        return result;
      } catch (err: any) {
        ctx.steps.push({
          name: 'handler.error',
          startTime: Date.now(),
          endTime: Date.now(),
          error: err?.message ?? String(err),
        });
        exportLocal(ctx);
        throw err;
      }
    });
  },
};
