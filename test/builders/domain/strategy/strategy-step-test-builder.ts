import { randomBoolean, randomFromList, randomNumber, randomPercentage, randomString } from '@hastobegood/crypto-bot-artillery/test/builders';
import {
  CheckOrderStepInput,
  CheckOrderStepOutput,
  MarketEvolutionInterval,
  MarketEvolutionSource,
  MarketEvolutionStepInput,
  MarketEvolutionStepOutput,
  MovingAverageCrossover,
  MovingAverageCrossoverStepInput,
  MovingAverageCrossoverStepOutput,
  MovingAverageSignal,
  MovingAverageType,
  OrConditionStep,
  OrConditionStepInput,
  OrConditionStepOutput,
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

export const buildDefaultStrategyStepTemplate = (): StrategyStepTemplate => {
  return buildStrategyStepTemplate(randomString(), 'SendOrder', buildDefaultSendOrderStepInput(), randomString());
};

export const buildDefaultMarketEvolutionStepTemplate = (): StrategyStepTemplate => {
  return buildStrategyStepTemplate(randomString(), 'MarketEvolution', buildDefaultMarketEvolutionStepInput(), randomString());
};

export const buildDefaultSendOrderStepTemplate = (): StrategyStepTemplate => {
  return buildStrategyStepTemplate(randomString(), 'SendOrder', buildDefaultSendOrderStepInput(), randomString());
};

export const buildDefaultMovingAverageCrossoverStepTemplate = (): StrategyStepTemplate => {
  return buildStrategyStepTemplate(randomString(), 'MovingAverageCrossover', buildDefaultMovingAverageCrossoverStepInput(), randomString());
};

export const buildStrategyStepTemplate = (id: string, type: StrategyStepType, input: StrategyStepInput, nextId?: string): StrategyStepTemplate => {
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
  return buildStrategyStep(buildDefaultMarketEvolutionStepTemplate(), randomString(), buildDefaultMarketEvolutionStepOutput(true));
};

export const buildDefaultSendOrderStep = (): StrategyStep => {
  return buildStrategyStep(buildDefaultSendOrderStepTemplate(), randomString(), buildDefaultSendOrderStepOutput(true));
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
  return buildMarketEvolutionStepOutput(success, randomNumber(), randomNumber(), randomPercentage());
};

export const buildMarketEvolutionStepOutput = (success: boolean, lastPrice: number, currentPrice: number, percentage: number): MarketEvolutionStepOutput => {
  return {
    success: success,
    lastPrice: lastPrice,
    currentPrice: currentPrice,
    percentage: percentage,
  };
};

export const buildDefaultOrConditionStepInput = (): OrConditionStepInput => {
  return buildOrConditionStepInput([
    { id: randomString(), priority: randomNumber() },
    { id: randomString(), priority: randomNumber() },
  ]);
};

export const buildOrConditionStepInput = (steps: OrConditionStep[]): OrConditionStepInput => {
  return {
    steps: steps,
  };
};

export const buildDefaultOrConditionStepOutput = (success: boolean): OrConditionStepOutput => {
  return {
    success: success,
    id: randomString(),
    nextId: randomString(),
    steps: [
      { ...{ id: randomString(), priority: randomNumber() }, ...buildDefaultMarketEvolutionStepOutput(true) },
      { ...{ id: randomString(), priority: randomNumber() }, ...buildDefaultMarketEvolutionStepOutput(false) },
    ],
  };
};

export const buildDefaultSendOrderStepInput = (): SendOrderStepInput => {
  return buildSendOrderStepInput(randomFromList(['Wallet', 'LastOrder']), randomPercentage(), randomFromList(['Buy', 'Sell']), 'Market');
};

export const buildSendOrderStepInput = (source: SendOrderSource, percentage: number, side: SendOrderSide, type: SendOrderType, deviation?: number): SendOrderStepInput => {
  return {
    source: source,
    side: side,
    type: type,
    percentage: percentage,
    deviation: deviation,
  };
};

export const buildDefaultSendOrderStepOutput = (success: boolean): SendOrderStepOutput => {
  const baseAsset = randomBoolean();
  return {
    success: success,
    id: randomString(),
    side: randomFromList(['Buy', 'Sell']),
    type: randomFromList(['Market', 'Limit']),
    status: randomString(),
    externalId: randomString(),
    externalStatus: randomString(),
    baseAssetQuantity: baseAsset ? randomNumber() : undefined,
    quoteAssetQuantity: baseAsset ? undefined : randomNumber(),
    priceLimit: randomNumber(),
  };
};

export const buildDefaultCheckOrderStepInput = (): CheckOrderStepInput => {
  return {
    id: randomString(),
    externalId: randomString(),
    side: randomFromList(['Buy', 'Sell']),
    type: randomFromList(['Market', 'Limit']),
  };
};

export const buildDefaultCheckOrderStepOutput = (success: boolean): CheckOrderStepOutput => {
  return {
    success: success,
    id: randomString(),
    status: randomString(),
    externalId: randomString(),
    externalStatus: randomString(),
    quantity: randomNumber(),
    price: randomNumber(),
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
    currentPrice: randomNumber(),
    shortTermPrice: randomNumber(),
    longTermPrice: randomNumber(),
  };
};
