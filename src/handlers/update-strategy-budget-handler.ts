import 'source-map-support/register';
import { Context, SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { handleEvent } from './handler-utils';
import { DdbStrategyRepository } from '../code/infrastructure/strategy/ddb-strategy-repository';
import { UpdateStrategyService } from '../code/domain/strategy/update-strategy-service';
import { UpdateStrategyBudgetMessageConsumer } from '../code/application/strategy/update-strategy-budget-message-consumer';
import { ProcessedStrategyStepMessage } from '../code/infrastructure/strategy/step/sqs-strategy-step-publisher';

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION }), { marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true, convertClassInstanceToMap: true } });

const strategyRepository = new DdbStrategyRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const updateStrategyService = new UpdateStrategyService(strategyRepository);

const updateStrategyBudgetConsumer = new UpdateStrategyBudgetMessageConsumer(updateStrategyService);

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => {
    const messages = event.Records.map((record) => JSON.parse(record.body) as ProcessedStrategyStepMessage);
    return updateStrategyBudgetConsumer.process(messages[0]);
  });
};
