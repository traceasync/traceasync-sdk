#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FlowSqsStack } from '../lib/flow-sqs-stack';

const app = new cdk.App();
new FlowSqsStack(app, 'TraceAsyncFlowSqsExample');
