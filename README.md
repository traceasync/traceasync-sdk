# TraceAsync SDK

**Trace async workflows end-to-end — without correlation IDs.**

TraceAsync is an open-source SDK for tracing **asynchronous workflows** across
Lambdas, queues, events, and AI calls.

It’s designed for systems where traditional request tracing breaks down:
event-driven architectures, background jobs, and AI agent pipelines.

⚠️ **Early development**
The API is stabilising. Feedback is very welcome.

---

## The mental model

- **traceId** → one workflow (end-to-end)
- **spanId** → one execution hop (Lambda, job, consumer, agent step)
- **parentSpanId** → causal link between hops

A single workflow can span many services, invocations, and retries —
all tied together by one `traceId`.

---

## Quickstart (local mode)

```ts
import { traceAsync } from '@traceasync/sdk';

traceAsync.init({
  service: 'api',
  mode: 'local',
});

const handler = traceAsync.lambda('api.generate', async () => {
  await traceAsync.step('openai.generate', async () => {
    // call LLM
  });

  await traceAsync.step('db.save', async () => {
    // persist result
  });
});

handler();
```

Output (simplified):

```json
{
  "traceId": "...",
  "span": "api.generate",
  "steps": ["openai.generate", "db.save"]
}
```

## Async propagation (the important part)

TraceAsync lets you resume a workflow in a different async execution
(e.g. SQS consumer) without relying on correlation IDs.

#### Producer

```ts
const producer = traceAsync.lambda('producer', async () => {
  const payload = traceAsync.propagate({ jobId: '123' });
  // send payload to queue
});
```

#### Consumer

```ts
await traceAsync.resume(payload, 'consumer', async () => {
  await traceAsync.step('process', async () => {
    // do work
  });
});
```

Result:

- Same traceId
- New spanId
- parentSpanId links producer → consumer

This works across Lambdas, queues, delays, and retries.

## 🛠 Why TraceAsync?

Most tracing tools assume synchronous request/response cycles or stable correlation IDs.

### TraceAsync is built for:

- Event-driven systems
- Async fan-out / fan-in
- Background jobs
- AI agent workflows

## Status

✅ Local exporter\
✅ Async propagation (propagate / resume)\
🚧 Cloud exporter + UI (in progress)

## 💬 Feedback

If you’re debugging async systems in production, I’d love your feedback.\
Issues and discussions are welcome.
