import { randomUUID } from "crypto";
import { TraceContext, TraceStep, traceStorage } from "./context";
import { exportLocal } from "./exporters/localExporter";

const TRACE_PAYLOAD_KEY = "_traceasync";
type InitConfig = {
  service: string;
  mode: "local" | "cloud";
};
let config: InitConfig | undefined;
type WithTrace<T> = T & {
  _traceasync?: {
    runId: string;
    runName: string;
    startTime: number;
  };
};

export const traceAsync = {
  init(cfg: InitConfig) {
    config = cfg;
  },

  lambda<T extends (...args: any[]) => any>(name: string, handler: T): T {
    return (async (...args: any[]) => {
      const ctx: TraceContext = {
        runId: randomUUID(),
        runName: name,
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
            name: "handler.error",
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

    const step: TraceStep = {
      name,
      startTime: Date.now(),
    };

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
    if (!ctx) return payload as WithTrace<T>;
    const base = (payload ?? ({} as T)) as T;
    return {
      ...base,
      [TRACE_PAYLOAD_KEY]: {
        runId: ctx.runId,
        runName: ctx.runName,
        startTime: ctx.startTime,
      },
    } satisfies WithTrace<T>;
  },

  async resume<T>(payload: any, fn: () => Promise<T>): Promise<T> {
    const trace = payload?.[TRACE_PAYLOAD_KEY];

    // No trace info → just run normally
    if (!trace) {
      return fn();
    }

    const ctx: TraceContext = {
      runId: trace.runId,
      runName: trace.runName,
      startTime: trace.startTime,
      continuedFromRunId: trace.runId,
      steps: [],
    };

    return traceStorage.run(ctx, async () => {
      try {
        const result = await fn();
        exportLocal(ctx);
        return result;
      } catch (err: any) {
        ctx.steps.push({
          name: "handler.error",
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
