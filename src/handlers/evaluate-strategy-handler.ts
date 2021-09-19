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
import { HttpOrderRepository } from '../code/infrastructure/order/http-order-repository';
import { CreateOrderService } from '../code/domain/order/create-order-service';
import { EvaluateStrategyMessageConsumer } from '../code/application/strategy/evaluate-strategy-message-consumer';
import { MovingAverageCrossoverStepService } from '../code/domain/strategy/step/moving-average-crossover-step-service';
import { MovingAverageService } from '../code/domain/technical-analysis/moving-average-service';
import { SqsStrategyStepPublisher } from '../code/infrastructure/strategy/step/sqs-strategy-step-publisher';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';

const binanceClient = new BinanceClient(smClient, process.env.BINANCE_SECRET_NAME, process.env.BINANCE_URL);

const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const getCandlestickService = new GetCandlestickService(candlestickRepository);

const orderRepository = new HttpOrderRepository(binanceClient);
const createOrderService = new CreateOrderService(orderRepository);

const strategyRepository = new DdbStrategyRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const getStrategyService = new GetStrategyService(strategyRepository);
const updateStrategyService = new UpdateStrategyService(strategyRepository);

const strategyStepRepository = new DdbStrategyStepRepository(process.env.STRATEGY_TABLE_NAME, ddbClient);
const strategyStepPublisher = new SqsStrategyStepPublisher(process.env.PROCESSED_STRATEGY_STEP_QUEUE_URL, sqsClient);
const marketEvolutionService = new MarketEvolutionService();
const marketEvolutionStepService = new MarketEvolutionStepService(getCandlestickService, marketEvolutionService, strategyStepRepository);
const movingAverageService = new MovingAverageService();
const movingAverageCrossoverService = new MovingAverageCrossoverStepService(getCandlestickService, movingAverageService);
const sendOrderStepService = new SendOrderStepService(createOrderService, strategyStepRepository);
const evaluateStrategyService = new EvaluateStrategyService([marketEvolutionStepService, movingAverageCrossoverService, sendOrderStepService], strategyStepRepository, strategyStepPublisher);

const evaluateStrategyMessageConsumer = new EvaluateStrategyMessageConsumer(getStrategyService, updateStrategyService, evaluateStrategyService);

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  return handleEvent(context, async () => {
    const messages = event.Records.map((record) => JSON.parse(record.body) as ActiveStrategyMessage);
    return evaluateStrategyMessageConsumer.process(messages[0]);
  });
};
