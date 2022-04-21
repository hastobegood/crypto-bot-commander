import { randomFromList, randomNumber, randomString, randomSymbol } from '@hastobegood/crypto-bot-artillery/test/builders';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const buildDefaultGetAllCandlesticksEvent = (): APIGatewayProxyEvent => {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/candlesticks',
    pathParameters: {},
    queryStringParameters: {
      exchange: randomFromList(['Binance']),
      symbol: randomSymbol(),
      interval: randomFromList(['1m', '5m', '15m', '30m', '1h', '6h', '12h', '1d']),
      limit: randomNumber(1, 1_000).toString(),
      unitl: new Date().valueOf().toString(),
    },
    multiValueQueryStringParameters: {},
    stageVariables: {},
    requestContext: {
      accountId: randomString(),
      apiId: randomString(),
      authorizer: {},
      protocol: randomString(),
      httpMethod: randomString(),
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: randomString(),
        user: null,
        userAgent: null,
        userArn: null,
      },
      path: randomString(),
      stage: randomString(),
      requestId: randomString(),
      requestTimeEpoch: randomNumber(),
      resourceId: randomString(),
      resourcePath: randomString(),
    },
    resource: randomString(),
  };
};
