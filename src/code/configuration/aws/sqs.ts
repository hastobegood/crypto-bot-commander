import { captureAWSv3Client } from 'aws-xray-sdk-core';
import { SQSClient } from '@aws-sdk/client-sqs';

let client = new SQSClient({ region: process.env.REGION });
if (process.env.TRACING) {
  client = captureAWSv3Client(client as any);
}

export const sqsClient = client;
