import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TranslateConfig } from '@aws-sdk/lib-dynamodb';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

const translateConfig: TranslateConfig = {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
};

let client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }), translateConfig);
if (process.env.TRACING) {
  client = captureAWSv3Client(client as any);
}

export const ddbClient = client;
