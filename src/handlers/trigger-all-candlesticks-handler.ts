import 'source-map-support/register';
import { handleEvent } from '@hastobegood/crypto-bot-artillery/common';
import { Context, ScheduledEvent } from 'aws-lambda';

import { TriggerAllCandlesticksEventScheduler } from '../code/application/candlestick/trigger-all-candlesticks-event-scheduler';
import { sqsClient } from '../code/configuration/aws/sqs';
import { PublishCandlestickService } from '../code/domain/candlestick/publish-candlestick-service';
import { SqsCandlestickPublisher } from '../code/infrastructure/candlestick/sqs-candlestick-publisher';

const candlestickPublisher = new SqsCandlestickPublisher(process.env.TRIGGERED_CANDLESTICKS_QUEUE_URL, sqsClient);
const publishCandlestickService = new PublishCandlestickService(candlestickPublisher);

const triggerAllCandlesticksEventScheduler = new TriggerAllCandlesticksEventScheduler(publishCandlestickService);
const symbols = process.env.AVAILABLE_SYMBOLS.split(',').map((symbol) => symbol.trim());

export const handler = async (event: ScheduledEvent, context: Context): Promise<void[]> => {
  return handleEvent(context, async () => Promise.all(symbols.map((symbol) => triggerAllCandlesticksEventScheduler.process('Binance', symbol))));
};
