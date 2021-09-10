import 'source-map-support/register';
import { Context, ScheduledEvent } from 'aws-lambda';
import { handleEvent } from './handler-utils';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { sqsClient } from '../code/configuration/aws/sqs';
import { DdbStrategyRepository } from '../code/infrastructure/strategy/ddb-strategy-repository';
import { SqsStrategyPublisher } from '../code/infrastructure/strategy/sqs-strategy-publisher';
import { PublishStrategyService } from '../code/domain/strategy/publish-strategy-service';
import { PublishAllActiveStrategiesEventScheduler } from '../code/application/strategy/publish-all-active-strategies-event-scheduler';

const strategyRepository = new DdbStrategyRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const strategyPublisher = new SqsStrategyPublisher(process.env.ACTIVE_STRATEGIES_QUEUE_URL, sqsClient);
const publishStrategyService = new PublishStrategyService(strategyRepository, strategyPublisher);

const publishAllActiveStrategiesEventScheduler = new PublishAllActiveStrategiesEventScheduler(publishStrategyService);

export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => publishAllActiveStrategiesEventScheduler.process());
};
