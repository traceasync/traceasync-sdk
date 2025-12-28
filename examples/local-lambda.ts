import { traceAsync } from '../src'

traceAsync.init({
  service: 'api',
  mode: 'local',
})

const handler = traceAsync.lambda('api.generate', async () => {
  const output = await traceAsync.step('openai.generate', async () => {
    await new Promise(r => setTimeout(r, 300))
    return 'Hello from AI'
  })

  await traceAsync.step('db.save', async () => {
    await new Promise(r => setTimeout(r, 80))
  })

  await traceAsync.step('sqs.enqueue', async () => {
    await new Promise(r => setTimeout(r, 40))
  })

  return { output }
})

handler()
