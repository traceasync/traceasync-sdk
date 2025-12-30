import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { traceAsync } from '@traceasync/sdk';

const sqs = new SQSClient({});

traceAsync.init({
  service: 'flow-sqs.producer',
  mode: 'cloud',
});

export const handler = traceAsync.lambda('producer', async () => {
  const queueUrl = process.env.QUEUE_URL;
  if (!queueUrl) throw new Error('QUEUE_URL missing');

  await traceAsync.step('enqueue', async () => {
    const payload = traceAsync.propagate({ hello: 'world', at: Date.now() });

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
      })
    );
  });

  return { ok: true };
});
