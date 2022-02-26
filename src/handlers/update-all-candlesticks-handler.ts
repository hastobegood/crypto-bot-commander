import 'source-map-support/register';
import { Context, SQSEvent } from 'aws-lambda';
import { smClient } from '../code/configuration/aws/secrets-manager';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { sqsClient } from '../code/configuration/aws/sqs';
import { BinanceAuthentication } from '../code/infrastructure/common/exchanges/binance/binance-authentication';
import { loadExchangesClients } from '@hastobegood/crypto-bot-artillery';
import { handleEvent } from '@hastobegood/crypto-bot-artillery/common';
import { loadFetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';
import { UpdateCandlestickService } from '../code/domain/candlestick/update-candlestick-service';
import { SqsCandlestickPublisher, TriggeredCandlesticksMessage } from '../code/infrastructure/candlestick/sqs-candlestick-publisher';
import { PublishCandlestickService } from '../code/domain/candlestick/publish-candlestick-service';
import { UpdateAllCandlesticksMessageConsumer } from '../code/application/candlestick/update-all-candlesticks-message-consumer';

const binanceAuthentication = new BinanceAuthentication(process.env.EXCHANGES_SECRET_NAME, smClient);
const exchangesClients = loadExchangesClients({ binanceApiInfoProvider: binanceAuthentication });
const fetchCandlestickClient = loadFetchCandlestickClient(exchangesClients);

const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const updateCandlestickService = new UpdateCandlestickService(fetchCandlestickClient, candlestickRepository);
const candlestickPublisher = new SqsCandlestickPublisher(process.env.UPDATED_CANDLESTICKS_QUEUE_URL, sqsClient);
const publishCandlestickService = new PublishCandlestickService(candlestickPublisher);

const updateAllCandlesticksMessageConsumer = new UpdateAllCandlesticksMessageConsumer(updateCandlestickService, publishCandlestickService);

export const handler = async (event: SQSEvent, context: Context): Promise<void[]> => {
  return handleEvent(context, async () => {
    const messages = event.Records.map((record) => JSON.parse(record.body) as TriggeredCandlesticksMessage);
    return Promise.all(messages.map((message) => updateAllCandlesticksMessageConsumer.process(message)));
  });
};
