import { randomBoolean, randomNumber, randomPercentage, randomString } from '../../random-test-builder';
import { BotTrading, BotTradingConfig, BotTradingEvaluation, BotTradingOrder } from '../../../../src/code/domain/bot-trading/model/bot-trading';

export const buildDefaultBotTradingConfig = (): BotTradingConfig => {
  return buildBotTradingConfig(randomPercentage(), randomPercentage(), randomPercentage());
};

export const buildBotTradingConfig = (buyPercentage: number, sellPercentage: number, dumpPercentage: number): BotTradingConfig => {
  return {
    baseAsset: randomString(5),
    quoteAsset: randomString(5),
    quoteAssetQuantity: randomNumber(1, 1_000),
    buyPercentage: buyPercentage,
    sellPercentage: sellPercentage,
    dumpPercentage: dumpPercentage,
  };
};

export const buildDefaultBotTrading = (): BotTrading => {
  return {
    id: randomString(10),
    symbol: randomString(5),
    creationDate: new Date(),
    evaluation: buildDefaultBotTradingEvaluation(),
    buyOrder: buildDefaultBotTradingOrder(),
    sellOrder: buildDefaultBotTradingOrder(),
  };
};

export const buildDefaultBotTradingEvaluation = (): BotTradingEvaluation => {
  return {
    currentPrice: randomNumber(100, 100_000),
    averagePrice: randomNumber(100, 100_000),
    averagePriceChangePercentage: randomPercentage(),
    dumpFromAveragePrice: randomBoolean(),
    lastBuyPrice: randomNumber(100, 100_000),
    lastBuyPriceChangePercentage: randomPercentage(),
    shouldBuy: randomBoolean(),
  };
};

export const buildDefaultBotTradingOrder = (): BotTradingOrder => {
  return {
    id: randomString(10),
    quantity: randomNumber(1, 1_000),
    price: randomNumber(100, 100_000),
  };
};
