import 'source-map-support/register';
import { Context, ScheduledEvent } from 'aws-lambda';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import SQS from 'aws-sdk/clients/sqs';
import { handleEvent } from './handler-utils';
import { DdbStrategyRepository } from '../code/infrastructure/strategy/ddb-strategy-repository';
import { SqsStrategyPublisher } from '../code/infrastructure/strategy/sqs-strategy-publisher';
import { PublishStrategyService } from '../code/domain/strategy/publish-strategy-service';
import { PublishAllActiveStrategiesEventScheduler } from '../code/application/strategy/publish-all-active-strategies-event-scheduler';

const ddbClient = new DynamoDB.DocumentClient({ region: process.env.REGION });
const sqsClient = new SQS({ region: process.env.REGION });

const strategyRepository = new DdbStrategyRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const strategyPublisher = new SqsStrategyPublisher(process.env.ACTIVE_STRATEGIES_QUEUE_URL, sqsClient);
const publishStrategyService = new PublishStrategyService(strategyRepository, strategyPublisher);

const publishAllActiveStrategiesScheduler = new PublishAllActiveStrategiesEventScheduler(publishStrategyService);

export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => publishAllActiveStrategiesScheduler.process());
};
