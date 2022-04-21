import { randomFromList, randomNumber, randomString, randomSymbol } from '@hastobegood/crypto-bot-artillery/test/builders';
import { random } from 'lodash-es';

import { Strategy, StrategyTemplate, StrategyWallet } from '../../../../src/code/domain/strategy/model/strategy';

import { buildDefaultMarketEvolutionStepInput, buildDefaultSendOrderStepInput, buildStrategyStepTemplate } from './strategy-step-test-builder';

export const buildDefaultStrategy = (): Strategy => {
  return {
    id: randomString(),
    exchange: randomFromList(['Binance']),
    symbol: randomSymbol(),
    status: 'Active',
    template: buildDefaultStrategyTemplate(),
  };
};

export const buildDefaultStrategyTemplate = (): StrategyTemplate => {
  return {
    '1': buildStrategyStepTemplate('1', 'MarketEvolution', buildDefaultMarketEvolutionStepInput(), '2'),
    '2': buildStrategyStepTemplate('2', 'SendOrder', buildDefaultSendOrderStepInput(), '1'),
  };
};

export const buildDefaultStrategyWallet = (): StrategyWallet => {
  return {
    initialBaseAssetQuantity: randomNumber(),
    availableBaseAssetQuantity: randomNumber(),
    profitAndLossBaseAssetQuantity: random(),
    initialQuoteAssetQuantity: randomNumber(),
    availableQuoteAssetQuantity: randomNumber(),
    profitAndLossQuoteAssetQuantity: random(),
  };
};
