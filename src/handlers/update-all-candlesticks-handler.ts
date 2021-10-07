import 'source-map-support/register';
import { Context, ScheduledEvent } from 'aws-lambda';
import { handleEvent } from './handler-utils';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { sqsClient } from '../code/configuration/aws/sqs';
import { smClient } from '../code/configuration/aws/secrets-manager';
import { BinanceClient } from '../code/infrastructure/binance/binance-client';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';
import { HttpCandlestickClient } from '../code/infrastructure/candlestick/http-candlestick-client';
import { UpdateCandlestickService } from '../code/domain/candlestick/update-candlestick-service';
import { UpdateAllCandlesticksEventScheduler } from '../code/application/candlestick/update-all-candlesticks-event-scheduler';
import { PublishCandlestickService } from '../code/domain/candlestick/publish-candlestick-service';
import { SqsCandlestickPublisher } from '../code/infrastructure/candlestick/sqs-candlestick-publisher';

const binanceClient = new BinanceClient(smClient, process.env.BINANCE_SECRET_NAME, process.env.BINANCE_URL);

const candlestickClient = new HttpCandlestickClient(binanceClient);
const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const updateCandlestickService = new UpdateCandlestickService(candlestickClient, candlestickRepository);
const candlestickPublisher = new SqsCandlestickPublisher(process.env.UPDATED_CANDLESTICKS_QUEUE_URL, sqsClient);
const publishCandlestickService = new PublishCandlestickService(candlestickPublisher);

const updateAllCandlesticksEventScheduler = new UpdateAllCandlesticksEventScheduler(updateCandlestickService, publishCandlestickService);
const symbols = process.env.AVAILABLE_SYMBOLS.split(',').map((symbol) => symbol.trim());

export const handler = async (event: ScheduledEvent, context: Context): Promise<void[]> => {
  return handleEvent(context, async () => Promise.all(symbols.map((symbol) => updateAllCandlesticksEventScheduler.process(symbol))));
};
