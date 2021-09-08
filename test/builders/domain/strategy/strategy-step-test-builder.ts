import {
  MarketEvolutionInterval,
  MarketEvolutionSource,
  MarketEvolutionStepInput,
  MarketEvolutionStepOutput,
  MovingAverageCrossover,
  MovingAverageCrossoverStepInput,
  MovingAverageCrossoverStepOutput,
  MovingAverageSignal,
  MovingAverageType,
  SendOrderSide,
  SendOrderSource,
  SendOrderStepInput,
  SendOrderStepOutput,
  SendOrderType,
  StrategyStep,
  StrategyStepInput,
  StrategyStepOutput,
  StrategyStepTemplate,
  StrategyStepType,
} from '../../../../src/code/domain/strategy/model/strategy-step';
import { randomFromList, randomNumber, randomPercentage, randomString } from '../../random-test-builder';

export const buildDefaultStrategyStepTemplate = (): StrategyStepTemplate => {
  return buildStrategyStepTemplate(randomString(), randomString(), 'SendOrder', buildDefaultSendOrderStepInput());
};

export const buildDefaultMarketEvolutionStepTemplate = (): StrategyStepTemplate => {
  return buildStrategyStepTemplate(randomString(), randomString(), 'MarketEvolution', buildDefaultMarketEvolutionStepInput());
};

export const buildDefaultSendOrderStepTemplate = (): StrategyStepTemplate => {
  return buildStrategyStepTemplate(randomString(), randomString(), 'SendOrder', buildDefaultSendOrderStepInput());
};

export const buildDefaultMovingAverageCrossoverStepTemplate = (): StrategyStepTemplate => {
  return buildStrategyStepTemplate(randomString(), randomString(), 'MovingAverageCrossover', buildDefaultMovingAverageCrossoverStepInput());
};

export const buildStrategyStepTemplate = (id: string, nextId: string, type: StrategyStepType, input: StrategyStepInput): StrategyStepTemplate => {
  return {
    id: id,
    type: type,
    input: input,
    nextId: nextId,
  };
};

export const buildDefaultStrategyStep = (): StrategyStep => {
  return buildDefaultMarketEvolutionStep();
};

export const buildDefaultMarketEvolutionStep = (): StrategyStep => {
  return buildStrategyStep(buildDefaultMarketEvolutionStepTemplate(), randomString(10), buildDefaultMarketEvolutionStepOutput(true));
};

export const buildDefaultSendOrderStep = (): StrategyStep => {
  return buildStrategyStep(buildDefaultSendOrderStepTemplate(), randomString(10), buildDefaultSendOrderStepOutput(true));
};

export const buildStrategyStep = (template: StrategyStepTemplate, strategyId: string, output: StrategyStepOutput): StrategyStep => {
  return {
    ...template,
    strategyId: strategyId,
    output: output,
    creationDate: new Date(),
    executionStartDate: new Date(),
    executionEndDate: new Date(),
  };
};

export const buildDefaultMarketEvolutionStepInput = (): MarketEvolutionStepInput => {
  return buildMarketEvolutionStepInput(randomFromList(['Market', 'LastOrder']), randomPercentage());
};

export const buildMarketEvolutionStepInput = (source: MarketEvolutionSource, percentageThreshold: number, interval?: MarketEvolutionInterval, period?: number): MarketEvolutionStepInput => {
  return {
    source: source,
    interval: interval,
    period: period,
    percentageThreshold: percentageThreshold,
  };
};

export const buildDefaultMarketEvolutionStepOutput = (success: boolean): MarketEvolutionStepOutput => {
  return buildMarketEvolutionStepOutput(success, randomNumber(100, 1_000), randomNumber(100, 1_000), randomPercentage());
};

export const buildMarketEvolutionStepOutput = (success: boolean, lastPrice: number, currentPrice: number, percentage: number): MarketEvolutionStepOutput => {
  return {
    success: success,
    lastPrice: lastPrice,
    currentPrice: currentPrice,
    percentage: percentage,
  };
};

export const buildDefaultSendOrderStepInput = (): SendOrderStepInput => {
  return buildSendOrderStepInput(randomFromList(['Account', 'LastOrder']), randomPercentage(), randomFromList(['Buy', 'Sell']), 'Market');
};

export const buildSendOrderStepInput = (source: SendOrderSource, percentage: number, side: SendOrderSide, type: SendOrderType): SendOrderStepInput => {
  return {
    source: source,
    side: side,
    type: type,
    percentage: percentage,
  };
};

export const buildDefaultSendOrderStepOutput = (success: boolean): SendOrderStepOutput => {
  return {
    success: success,
    id: randomString(),
    status: randomString(),
    externalId: randomString(),
    externalStatus: randomString(),
    quantity: randomNumber(100, 500),
    price: randomNumber(1_000, 10_000),
  };
};

export const buildDefaultMovingAverageCrossoverStepInput = (): MovingAverageCrossoverStepInput => {
  return buildMovingAverageCrossoverStepInput(randomFromList(['SMA', 'CMA', 'EMA']), randomFromList(['CurrentPrice', 'ShortTermPrice']), randomFromList(['Buy', 'Sell']), randomNumber(1, 5), randomNumber(10, 25));
};

export const buildMovingAverageCrossoverStepInput = (type: MovingAverageType, crossover: MovingAverageCrossover, signal: MovingAverageSignal, shortTermPeriod: number, longTermPeriod: number): MovingAverageCrossoverStepInput => {
  return {
    type: type,
    crossover: crossover,
    signal: signal,
    shortTermPeriod: shortTermPeriod,
    longTermPeriod: longTermPeriod,
  };
};

export const buildDefaultMovingAverageCrossoverStepOutput = (success: boolean): MovingAverageCrossoverStepOutput => {
  return {
    success: success,
    currentPrice: randomNumber(1_000, 10_000),
    shortTermPrice: randomNumber(1_000, 10_000),
    longTermPrice: randomNumber(1_000, 10_000),
  };
};
