import { traceAsync } from '../packages/sdk/src';

traceAsync.init({ service: 'api', mode: 'local' });

const handler = traceAsync.lambda('api.error', async () => {
  await traceAsync.step('will.fail', async () => {
    throw new Error('boom');
  });
});

handler().catch(() => {});
