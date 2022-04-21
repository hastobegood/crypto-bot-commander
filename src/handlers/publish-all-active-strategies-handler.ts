import 'source-map-support/register';
import { handleEvent } from '@hastobegood/crypto-bot-artillery/common';
import { Context, SQSEvent } from 'aws-lambda';

import { PublishAllActiveStrategiesMessageConsumer } from '../code/application/strategy/publish-all-active-strategies-message-consumer';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { sqsClient } from '../code/configuration/aws/sqs';
import { PublishStrategyService } from '../code/domain/strategy/publish-strategy-service';
import { UpdatedCandlesticksMessage } from '../code/infrastructure/candlestick/sqs-candlestick-publisher';
import { DdbStrategyRepository } from '../code/infrastructure/strategy/ddb-strategy-repository';
import { SqsStrategyPublisher } from '../code/infrastructure/strategy/sqs-strategy-publisher';

const strategyRepository = new DdbStrategyRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const strategyPublisher = new SqsStrategyPublisher(process.env.ACTIVE_STRATEGIES_QUEUE_URL, sqsClient);
const publishStrategyService = new PublishStrategyService(strategyRepository, strategyPublisher);

const publishAllActiveStrategiesMessageConsumer = new PublishAllActiveStrategiesMessageConsumer(publishStrategyService);

export const handler = async (event: SQSEvent, context: Context): Promise<void[]> => {
  return handleEvent(context, async () => {
    const messages = event.Records.map((record) => JSON.parse(record.body) as UpdatedCandlesticksMessage);
    return Promise.all(messages.map((message) => publishAllActiveStrategiesMessageConsumer.process(message)));
  });
};
