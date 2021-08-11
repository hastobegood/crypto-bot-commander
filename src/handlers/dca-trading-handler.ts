import 'source-map-support/register';
import { DcaTradingScheduler } from '../code/application/dca-trading/dca-trading-scheduler';
import { Context, ScheduledEvent } from 'aws-lambda';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import { BinanceClient } from '../code/infrastructure/binance/binance-client';
import { HttpAccountRepository } from '../code/infrastructure/account/http-account-repository';
import { DefaultAccountService } from '../code/domain/account/default-account-service';
import { DefaultDcaTradingService } from '../code/domain/dca-trading/default-dca-trading-service';
import { DcaTradingConfig } from '../code/domain/dca-trading/model/dca-trading';
import { HttpOrderRepository } from '../code/infrastructure/order/http-order-repository';
import { DefaultOrderService } from '../code/domain/order/default-order-service';
import { handleEvent } from './handler-utils';
import { DdbDcaTradingRepository } from '../code/infrastructure/dca-trading/ddb-dca-trading-repository';
import DynamoDB from 'aws-sdk/clients/dynamodb';

const ddbClient = new DynamoDB.DocumentClient({ region: process.env.REGION });
const smClient = new SecretsManager({ region: process.env.REGION });

const binanceClient = new BinanceClient(smClient, process.env.BINANCE_SECRET_NAME, process.env.BINANCE_URL);

const accountRepository = new HttpAccountRepository(binanceClient);
const accountService = new DefaultAccountService(accountRepository);

const orderRepository = new HttpOrderRepository(binanceClient);
const orderService = new DefaultOrderService(orderRepository);

const dcaTradingConfig = JSON.parse(process.env.DCA_TRADING_CONFIG) as DcaTradingConfig;
const dcaTradingRepository = new DdbDcaTradingRepository(process.env.TRADING_TABLE_NAME, ddbClient);
const dcaTradingService = new DefaultDcaTradingService(orderService, dcaTradingRepository);
const dcaTradingScheduler = new DcaTradingScheduler(accountService, dcaTradingService, dcaTradingConfig);

export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => dcaTradingScheduler.trade());
};
