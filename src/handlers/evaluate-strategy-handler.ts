import 'source-map-support/register';
import { Context, SQSEvent } from 'aws-lambda';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import { handleEvent } from './handler-utils';
import { StrategyMessage } from '../code/infrastructure/strategy/sqs-strategy-publisher';
import { DdbStrategyRepository } from '../code/infrastructure/strategy/ddb-strategy-repository';
import { DdbStrategyStepRepository } from '../code/infrastructure/strategy/step/ddb-strategy-step-repository';
import { GetStrategyService } from '../code/domain/strategy/get-strategy-service';
import { UpdateStrategyService } from '../code/domain/strategy/update-strategy-service';
import { EvaluateStrategyService } from '../code/domain/strategy/evaluate-strategy-service';
import { HttpCandlestickRepository } from '../code/infrastructure/candlestick/http-candlestick-repository';
import { BinanceClient } from '../code/infrastructure/binance/binance-client';
import { GetCandlestickService } from '../code/domain/candlestick/get-candlestick-service';
import { MarketEvolutionStepService } from '../code/domain/strategy/step/market-evolution-step-service';
import { MarketEvolutionService } from '../code/domain/technical-analysis/market-evolution-service';
import { SendOrderStepService } from '../code/domain/strategy/step/send-order-step-service';
import { HttpAccountRepository } from '../code/infrastructure/account/http-account-repository';
import { GetAccountService } from '../code/domain/account/get-account-service';
import { HttpOrderRepository } from '../code/infrastructure/order/http-order-repository';
import { CreateOrderService } from '../code/domain/order/create-order-service';
import { EvaluateStrategyMessageConsumer } from '../code/application/strategy/evaluate-strategy-message-consumer';

const ddbClient = new DynamoDB.DocumentClient({ region: process.env.REGION });
const smClient = new SecretsManager({ region: process.env.REGION });

const binanceClient = new BinanceClient(smClient, process.env.BINANCE_SECRET_NAME, process.env.BINANCE_URL);

const accountRepository = new HttpAccountRepository(binanceClient);
const accountService = new GetAccountService(accountRepository);

const candlestickRepository = new HttpCandlestickRepository(binanceClient);
const candlestickService = new GetCandlestickService(candlestickRepository);

const orderRepository = new HttpOrderRepository(binanceClient);
const orderService = new CreateOrderService(orderRepository);

const strategyRepository = new DdbStrategyRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const getStrategyService = new GetStrategyService(strategyRepository);
const updateStrategyService = new UpdateStrategyService(strategyRepository);

const strategyStepRepository = new DdbStrategyStepRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const marketEvolutionService = new MarketEvolutionService();
const marketEvolutionStepService = new MarketEvolutionStepService(candlestickService, marketEvolutionService, strategyStepRepository);
const sendOrderStepService = new SendOrderStepService(accountService, orderService, strategyStepRepository);
const evaluateStrategyService = new EvaluateStrategyService([marketEvolutionStepService, sendOrderStepService], strategyStepRepository);

const evaluateStrategiesScheduler = new EvaluateStrategyMessageConsumer(getStrategyService, updateStrategyService, evaluateStrategyService);

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => {
    const messages = event.Records.map((record) => JSON.parse(record.body) as StrategyMessage);
    return evaluateStrategiesScheduler.process(messages[0]);
  });
};
