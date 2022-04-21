import { SQSClient } from '@aws-sdk/client-sqs';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

let client = new SQSClient({ region: process.env.REGION });
if (process.env.TRACING) {
  client = captureAWSv3Client(client as any);
}

export const sqsClient = client;
