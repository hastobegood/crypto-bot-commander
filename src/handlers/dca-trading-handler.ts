import 'source-map-support/register';
import { Context, ScheduledEvent } from 'aws-lambda';
import { handleEvent } from './handler-utils';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { smClient } from '../code/configuration/aws/secrets-manager';
import { BinanceClient } from '../code/infrastructure/binance/binance-client';
import { ProcessDcaTradingService } from '../code/domain/dca-trading/process-dca-trading-service';
import { DcaTradingConfig } from '../code/domain/dca-trading/model/dca-trading';
import { HttpOrderRepository } from '../code/infrastructure/order/http-order-repository';
import { CreateOrderService } from '../code/domain/order/create-order-service';
import { DdbDcaTradingRepository } from '../code/infrastructure/dca-trading/ddb-dca-trading-repository';
import { DcaTradingEventScheduler } from '../code/application/dca-trading/dca-trading-event-scheduler';
import { HttpTickerRepository } from '../code/infrastructure/ticker/http-ticker-repository';
import { GetTickerService } from '../code/domain/ticker/get-ticker-service';

const binanceClient = new BinanceClient(smClient, process.env.BINANCE_SECRET_NAME, process.env.BINANCE_URL);

const tickerRepository = new HttpTickerRepository(binanceClient);
const getTickerService = new GetTickerService(tickerRepository);

const orderRepository = new HttpOrderRepository(binanceClient);
const createOrderService = new CreateOrderService(getTickerService, orderRepository);

const dcaTradingConfig = JSON.parse(process.env.DCA_TRADING_CONFIG) as DcaTradingConfig;
const dcaTradingRepository = new DdbDcaTradingRepository(process.env.DCA_TRADING_TABLE_NAME, ddbClient);
const processDcaTradingService = new ProcessDcaTradingService(createOrderService, dcaTradingRepository);

const dcaTradingScheduler = new DcaTradingEventScheduler(processDcaTradingService, dcaTradingConfig);

export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => dcaTradingScheduler.process());
};
