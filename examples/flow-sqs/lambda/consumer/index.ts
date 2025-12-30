import { traceAsync } from '@traceasync/sdk';
import type { SQSEvent } from 'aws-lambda';

traceAsync.init({
  service: 'flow-sqs.consumer',
  mode: 'cloud',
});

export const handler = async (event: SQSEvent) => {
  // process each message as its own resumed context
  for (const record of event.Records) {
    const payload = JSON.parse(record.body);

    await traceAsync.resume(payload, 'consumer', async () => {
      await traceAsync.step('process', async () => {
        // simulate some work
        await new Promise((r) => setTimeout(r, 50));
      });
    });
  }
};
