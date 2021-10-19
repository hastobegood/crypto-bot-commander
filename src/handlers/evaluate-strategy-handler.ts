import 'source-map-support/register';
import { Context, SQSEvent } from 'aws-lambda';
import { handleEvent } from './handler-utils';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { sqsClient } from '../code/configuration/aws/sqs';
import { smClient } from '../code/configuration/aws/secrets-manager';
import { ActiveStrategyMessage } from '../code/infrastructure/strategy/sqs-strategy-publisher';
import { DdbStrategyRepository } from '../code/infrastructure/strategy/ddb-strategy-repository';
import { DdbStrategyStepRepository } from '../code/infrastructure/strategy/step/ddb-strategy-step-repository';
import { GetStrategyService } from '../code/domain/strategy/get-strategy-service';
import { UpdateStrategyService } from '../code/domain/strategy/update-strategy-service';
import { EvaluateStrategyService } from '../code/domain/strategy/evaluate-strategy-service';
import { BinanceClient } from '../code/infrastructure/binance/binance-client';
import { GetCandlestickService } from '../code/domain/candlestick/get-candlestick-service';
import { MarketEvolutionStepService } from '../code/domain/strategy/step/market-evolution-step-service';
import { MarketEvolutionService } from '../code/domain/technical-analysis/market-evolution-service';
import { SendOrderStepService } from '../code/domain/strategy/step/send-order-step-service';
import { HttpOrderClient } from '../code/infrastructure/order/http-order-client';
import { CreateOrderService } from '../code/domain/order/create-order-service';
import { EvaluateStrategyMessageConsumer } from '../code/application/strategy/evaluate-strategy-message-consumer';
import { MovingAverageCrossoverStepService } from '../code/domain/strategy/step/moving-average-crossover-step-service';
import { MovingAverageService } from '../code/domain/technical-analysis/moving-average-service';
import { SqsStrategyStepPublisher } from '../code/infrastructure/strategy/step/sqs-strategy-step-publisher';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';
import { CheckOrderStepService } from '../code/domain/strategy/step/check-order-step-service';
import { CheckOrderService } from '../code/domain/order/check-order-service';
import { HttpTickerRepository } from '../code/infrastructure/ticker/http-ticker-repository';
import { GetTickerService } from '../code/domain/ticker/get-ticker-service';
import { DdbOrderRepository } from '../code/infrastructure/order/ddb-order-repository';
import { UpdateOrderService } from '../code/domain/order/update-order-service';
import { OrConditionStepService } from '../code/domain/strategy/step/or-condition-step-service';

const binanceClient = new BinanceClient(smClient, process.env.BINANCE_SECRET_NAME, process.env.BINANCE_URL);

const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const getCandlestickService = new GetCandlestickService(candlestickRepository);

const tickerRepository = new HttpTickerRepository(binanceClient);
const getTickerService = new GetTickerService(tickerRepository);

const orderClient = new HttpOrderClient(binanceClient);
const orderRepository = new DdbOrderRepository(process.env.ORDER_TABLE_NAME, ddbClient);
const createOrderService = new CreateOrderService(getTickerService, orderClient, orderRepository);
const updateOrderService = new UpdateOrderService(orderRepository);
const checkOrderService = new CheckOrderService(orderClient);

const strategyRepository = new DdbStrategyRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const getStrategyService = new GetStrategyService(strategyRepository);
const updateStrategyService = new UpdateStrategyService(strategyRepository);

const marketEvolutionService = new MarketEvolutionService();
const movingAverageService = new MovingAverageService();

const strategyStepRepository = new DdbStrategyStepRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const strategyStepPublisher = new SqsStrategyStepPublisher(process.env.PROCESSED_STRATEGY_STEP_QUEUE_URL, sqsClient);
const marketEvolutionStepService = new MarketEvolutionStepService(getCandlestickService, marketEvolutionService, strategyStepRepository);
const movingAverageCrossoverService = new MovingAverageCrossoverStepService(getCandlestickService, movingAverageService);
const sendOrderStepService = new SendOrderStepService(getStrategyService, createOrderService, getCandlestickService, strategyStepRepository);
const checkOrderStepService = new CheckOrderStepService(checkOrderService, updateOrderService, updateStrategyService);
const orConditionStepService = new OrConditionStepService([marketEvolutionStepService, movingAverageCrossoverService]);
const evaluateStrategyService = new EvaluateStrategyService([marketEvolutionStepService, movingAverageCrossoverService, sendOrderStepService, checkOrderStepService, orConditionStepService], strategyStepRepository, strategyStepPublisher);

const evaluateStrategyMessageConsumer = new EvaluateStrategyMessageConsumer(getStrategyService, updateStrategyService, evaluateStrategyService);

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => {
    const messages = event.Records.map((record) => JSON.parse(record.body) as ActiveStrategyMessage);
    return evaluateStrategyMessageConsumer.process(messages[0]);
  });
};
