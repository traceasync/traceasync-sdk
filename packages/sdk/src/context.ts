import { AsyncLocalStorage } from 'async_hooks';

export type TraceStep = {
  name: string;
  startTime: number;
  endTime?: number;
  error?: string;
};

export type TraceContext = {
  service: string;
  traceId: string; // workflow id (stable across async hops)
  spanId: string; // execution/hop id (new per lambda invocation)
  parentSpanId?: string; // link to previous hop

  traceName: string; // workflow name (often first lambda name)
  spanName: string; // this hop name (e.g. "producer", "consumer")

  startTime: number;
  steps: TraceStep[];
};

export const traceStorage = new AsyncLocalStorage<TraceContext>();
