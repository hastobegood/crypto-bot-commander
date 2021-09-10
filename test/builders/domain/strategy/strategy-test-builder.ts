import { randomNumber, randomString, randomSymbol } from '../../random-test-builder';
import { Strategy, StrategyBudget, StrategyTemplate } from '../../../../src/code/domain/strategy/model/strategy';
import { buildDefaultMarketEvolutionStepInput, buildDefaultSendOrderStepInput, buildStrategyStepTemplate } from './strategy-step-test-builder';
import { random } from 'lodash';

export const buildDefaultStrategy = (): Strategy => {
  return {
    id: randomString(),
    symbol: randomSymbol(),
    status: 'Active',
    template: buildDefaultStrategyTemplate(),
    budget: buildDefaultStrategyBudget(),
  };
};

export const buildDefaultStrategyTemplate = (): StrategyTemplate => {
  return {
    '1': buildStrategyStepTemplate('1', '2', 'MarketEvolution', buildDefaultMarketEvolutionStepInput()),
    '2': buildStrategyStepTemplate('2', '1', 'SendOrder', buildDefaultSendOrderStepInput()),
  };
};

export const buildDefaultStrategyBudget = (): StrategyBudget => {
  return {
    initialBaseAssetQuantity: randomNumber(1_000, 2_000),
    availableBaseAssetQuantity: randomNumber(500, 1_000),
    profitAndLossBaseAssetQuantity: random(-500, 500),
    initialQuoteAssetQuantity: randomNumber(1_000, 2_000),
    availableQuoteAssetQuantity: randomNumber(500, 1_000),
    profitAndLossQuoteAssetQuantity: random(-500, 500),
  };
};
