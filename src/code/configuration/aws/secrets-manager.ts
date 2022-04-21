import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

let client = new SecretsManagerClient({ region: process.env.REGION });
if (process.env.TRACING) {
  client = captureAWSv3Client(client as any);
}

export const smClient = client;
