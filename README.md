# TraceAsync SDK

Open-source SDK for tracing async workflows and AI calls.

⚠️ **Early development**
APIs are experimental and will change as we refine developer experience,
especially for async and event-driven systems.

## Quickstart (local mode)

```ts
traceAsync.init({ service: 'api', mode: 'local' })

export const handler = traceAsync.lambda('api.generate', async () => {
  await traceAsync.step('db.save', async () => {})
})
