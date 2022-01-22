import 'source-map-support/register';
import { Context, ScheduledEvent } from 'aws-lambda';
import { smClient } from '../code/configuration/aws/secrets-manager';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { sqsClient } from '../code/configuration/aws/sqs';
import { BinanceAuthentication } from '../code/infrastructure/common/exchanges/binance/binance-authentication';
import { loadExchangesClients } from '@hastobegood/crypto-bot-artillery';
import { handleEvent } from '@hastobegood/crypto-bot-artillery/common';
import { loadFetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';
import { UpdateCandlestickService } from '../code/domain/candlestick/update-candlestick-service';
import { SqsCandlestickPublisher } from '../code/infrastructure/candlestick/sqs-candlestick-publisher';
import { PublishCandlestickService } from '../code/domain/candlestick/publish-candlestick-service';
import { UpdateAllCandlesticksEventScheduler } from '../code/application/candlestick/update-all-candlesticks-event-scheduler';

const binanceAuthentication = new BinanceAuthentication(process.env.EXCHANGES_SECRET_NAME, smClient);
const exchangesClients = loadExchangesClients({ binanceApiInfoProvider: binanceAuthentication });
const fetchCandlestickClient = loadFetchCandlestickClient(exchangesClients);

const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const updateCandlestickService = new UpdateCandlestickService(fetchCandlestickClient, candlestickRepository);
const candlestickPublisher = new SqsCandlestickPublisher(process.env.UPDATED_CANDLESTICKS_QUEUE_URL, sqsClient);
const publishCandlestickService = new PublishCandlestickService(candlestickPublisher);

const updateAllCandlesticksEventScheduler = new UpdateAllCandlesticksEventScheduler(updateCandlestickService, publishCandlestickService);
const symbols = process.env.AVAILABLE_SYMBOLS.split(',').map((symbol) => symbol.trim());

export const handler = async (event: ScheduledEvent, context: Context): Promise<void[]> => {
  return handleEvent(context, async () => Promise.all(symbols.map((symbol) => updateAllCandlesticksEventScheduler.process('Binance', symbol))));
};
