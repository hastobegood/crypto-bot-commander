import 'source-map-support/register';
import { loadExchangesClients } from '@hastobegood/crypto-bot-artillery';
import { loadFetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { handleEvent } from '@hastobegood/crypto-bot-artillery/common';
import { Context } from 'aws-lambda';

import { InitializeAllCandlesticksApiController } from '../code/application/candlestick/initialize-all-candlesticks-api-controller';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { smClient } from '../code/configuration/aws/secrets-manager';
import { InitializeCandlestickService } from '../code/domain/candlestick/initialize-candlestick-service';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';
import { BinanceAuthentication } from '../code/infrastructure/common/exchanges/binance/binance-authentication';

const binanceAuthentication = new BinanceAuthentication(process.env.EXCHANGES_SECRET_NAME, smClient);
const exchangesClients = loadExchangesClients({ binanceApiInfoProvider: binanceAuthentication });
const fetchCandlestickClient = loadFetchCandlestickClient(exchangesClients);

const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const initializeCandlestickService = new InitializeCandlestickService(fetchCandlestickClient, candlestickRepository);

const initializeAllCandlesticksApiController = new InitializeAllCandlesticksApiController(initializeCandlestickService);

export const handler = async (event: InitializeAllCandlesticksEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => initializeAllCandlesticksApiController.process('Binance', event.symbol, event.year, event.month));
};

interface InitializeAllCandlesticksEvent {
  symbol: string;
  year: number;
  month: number;
}
