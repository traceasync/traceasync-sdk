import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

export class FlowSqsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new Queue(this, 'TraceAsyncExampleQueue', {
      visibilityTimeout: Duration.seconds(30),
    });

    const producer = new NodejsFunction(this, 'ProducerFn', {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/producer/index.ts'),
      handler: 'handler',
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
      bundling: {
        sourceMap: true,
      },
    });

    const consumer = new NodejsFunction(this, 'ConsumerFn', {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/consumer/index.ts'),
      handler: 'handler',
      bundling: {
        sourceMap: true,
      },
    });

    consumer.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 5,
      })
    );
    queue.grantSendMessages(producer);
    queue.grantConsumeMessages(consumer);

    new CfnOutput(this, 'QueueUrl', { value: queue.queueUrl });
    new CfnOutput(this, 'ProducerName', { value: producer.functionName });
    new CfnOutput(this, 'ConsumerName', { value: consumer.functionName });
  }
}
