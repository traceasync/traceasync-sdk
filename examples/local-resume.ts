import { traceAsync } from '../packages/sdk/src';

traceAsync.init({ service: 'api', mode: 'local' });

const producer = traceAsync.lambda('producer', async () => {
  await traceAsync.step('enqueue', async () => {
    await new Promise((r) => setTimeout(r, 50));
  });

  return traceAsync.propagate({ message: 'hello' });
});

const consumer = async (payload: any) => {
  await traceAsync.resume(payload, 'consumer', async () => {
    await traceAsync.step('process', async () => {
      await new Promise((r) => setTimeout(r, 80));
    });
  });
};

(async () => {
  const msg = await producer();
  await consumer(msg);
})();
