import { captureAWSv3Client } from 'aws-xray-sdk-core';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

let client = new SecretsManagerClient({ region: process.env.REGION });
if (process.env.TRACING) {
  client = captureAWSv3Client(client);
}

export const smClient = client;
