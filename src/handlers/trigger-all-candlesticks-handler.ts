import 'source-map-support/register';
import { Context, ScheduledEvent } from 'aws-lambda';
import { sqsClient } from '../code/configuration/aws/sqs';
import { handleEvent } from '@hastobegood/crypto-bot-artillery/common';
import { SqsCandlestickPublisher } from '../code/infrastructure/candlestick/sqs-candlestick-publisher';
import { PublishCandlestickService } from '../code/domain/candlestick/publish-candlestick-service';
import { TriggerAllCandlesticksEventScheduler } from '../code/application/candlestick/trigger-all-candlesticks-event-scheduler';

const candlestickPublisher = new SqsCandlestickPublisher(process.env.TRIGGERED_CANDLESTICKS_QUEUE_URL, sqsClient);
const publishCandlestickService = new PublishCandlestickService(candlestickPublisher);

const triggerAllCandlesticksEventScheduler = new TriggerAllCandlesticksEventScheduler(publishCandlestickService);
const symbols = process.env.AVAILABLE_SYMBOLS.split(',').map((symbol) => symbol.trim());

export const handler = async (event: ScheduledEvent, context: Context): Promise<void[]> => {
  return handleEvent(context, async () => Promise.all(symbols.map((symbol) => triggerAllCandlesticksEventScheduler.process('Binance', symbol))));
};
