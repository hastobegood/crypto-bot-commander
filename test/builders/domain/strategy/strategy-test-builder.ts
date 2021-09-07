import { randomString, randomSymbol } from '../../random-test-builder';
import { Strategy, StrategyTemplate } from '../../../../src/code/domain/strategy/model/strategy';
import { buildDefaultMarketEvolutionStepInput, buildDefaultSendOrderStepInput, buildStrategyStepTemplate } from './strategy-step-test-builder';

export const buildDefaultStrategy = (): Strategy => {
  return {
    id: randomString(),
    symbol: randomSymbol(),
    status: 'Active',
    template: buildDefaultStrategyTemplate(),
  };
};

export const buildDefaultStrategyTemplate = (): StrategyTemplate => {
  return {
    '1': buildStrategyStepTemplate('1', '2', 'MarketEvolution', buildDefaultMarketEvolutionStepInput()),
    '2': buildStrategyStepTemplate('2', '1', 'SendOrder', buildDefaultSendOrderStepInput()),
  };
};
