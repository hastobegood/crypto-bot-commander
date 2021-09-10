import { captureAWSv3Client } from 'aws-xray-sdk-core';
import { DynamoDBDocumentClient, TranslateConfig } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const translateConfig: TranslateConfig = {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
};

let client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }), translateConfig);
if (process.env.TRACING) {
  client = captureAWSv3Client(client);
}

export const ddbClient = client;
