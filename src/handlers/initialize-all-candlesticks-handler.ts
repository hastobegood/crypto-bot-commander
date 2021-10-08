import 'source-map-support/register';
import { Context } from 'aws-lambda';
import { handleEvent } from './handler-utils';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { BinanceClient } from '../code/infrastructure/binance/binance-client';
import { smClient } from '../code/configuration/aws/secrets-manager';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';
import { InitializeCandlestickService } from '../code/domain/candlestick/initialize-candlestick-service';
import { HttpCandlestickClient } from '../code/infrastructure/candlestick/http-candlestick-client';
import { InitializeAllCandlesticksApiController } from '../code/application/candlestick/initialize-all-candlesticks-api-controller';

const binanceClient = new BinanceClient(smClient, process.env.BINANCE_SECRET_NAME, process.env.BINANCE_URL);

const candlestickClient = new HttpCandlestickClient(binanceClient);
const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const initializeCandlestickService = new InitializeCandlestickService(candlestickClient, candlestickRepository);

const initializeAllCandlesticksApiController = new InitializeAllCandlesticksApiController(initializeCandlestickService);

export const handler = async (event: InitializeAllCandlesticksEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => initializeAllCandlesticksApiController.process(event.symbol, event.year, event.month));
};

interface InitializeAllCandlesticksEvent {
  symbol: string;
  year: number;
  month: number;
}
