import 'source-map-support/register';
import { handleEvent } from './handler-utils';
import { Context, ScheduledEvent } from 'aws-lambda';
import { BotTradingScheduler } from '../code/application/bot-trading/bot-trading-scheduler';
import { BotTradingConfig } from '../code/domain/bot-trading/model/bot-trading';
import { DefaultBotTradingService } from '../code/domain/bot-trading/default-bot-trading-service';
import { HttpOrderRepository } from '../code/infrastructure/order/http-order-repository';
import { DefaultOrderService } from '../code/domain/order/default-order-service';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { BinanceClient } from '../code/infrastructure/binance/binance-client';
import { DefaultPriceService } from '../code/domain/price/default-price-service';
import { DdbBotTradingRepository } from '../code/infrastructure/bot-trading/ddb-bot-trading-repository';
import { HttpAccountRepository } from '../code/infrastructure/account/http-account-repository';
import { DefaultAccountService } from '../code/domain/account/default-account-service';
import { HttpPriceRepository } from '../code/infrastructure/price/http-price-repository';

const ddbClient = new DynamoDB.DocumentClient({ region: process.env.REGION });
const smClient = new SecretsManager({ region: process.env.REGION });

const binanceClient = new BinanceClient(smClient, process.env.BINANCE_SECRET_NAME, process.env.BINANCE_URL);

const accountRepository = new HttpAccountRepository(binanceClient);
const accountService = new DefaultAccountService(accountRepository);

const orderRepository = new HttpOrderRepository(binanceClient);
const orderService = new DefaultOrderService(orderRepository);

const priceRepository = new HttpPriceRepository(binanceClient);
const priceService = new DefaultPriceService(priceRepository);

const botTradingConfig = JSON.parse(process.env.BOT_TRADING_CONFIG) as BotTradingConfig;
const botTradingRepository = new DdbBotTradingRepository(process.env.TRADING_TABLE_NAME, ddbClient);
const botTradingService = new DefaultBotTradingService(priceService, orderService, botTradingRepository);
const botTradingScheduler = new BotTradingScheduler(accountService, botTradingService, botTradingConfig);

export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => botTradingScheduler.trade());
};
