import { DcaTrading, DcaTradingConfig, DcaTradingConfigTradeAsset, DcaTradingOrder } from '../../../../src/code/domain/dca-trading/model/dca-trading';
import { randomBoolean, randomNumber, randomPercentage, randomString, randomSymbol } from '../../random-test-builder';

export const buildDefaultDcaTradingConfig = (): DcaTradingConfig => {
  return {
    baseAsset: randomString(5).toUpperCase(),
    quoteAsset: randomString(5).toUpperCase(),
    quoteAssetQuantity: randomNumber(1, 100_000),
    tradeAssets: [
      {
        asset: randomString(5).toUpperCase(),
        percentage: randomPercentage(),
      },
      {
        asset: randomString(5).toUpperCase(),
        percentage: randomPercentage(),
      },
      {
        asset: randomString(5).toUpperCase(),
        percentage: randomPercentage(),
      },
    ],
  };
};

export const buildDcaTradingConfig = (baseAsset: string, quoteAsset: string, quoteAssetQuantity: number, tradeAssets: DcaTradingConfigTradeAsset[]): DcaTradingConfig => {
  return {
    baseAsset: baseAsset,
    quoteAsset: quoteAsset,
    quoteAssetQuantity: quoteAssetQuantity,
    tradeAssets: tradeAssets,
  };
};

export const buildDcaTradingConfigTradeAsset = (asset: string, percentage: number): DcaTradingConfigTradeAsset => {
  return {
    asset: asset,
    percentage: percentage,
  };
};

export const buildDefaultDcaTrading = (): DcaTrading => {
  return {
    id: randomString(10),
    success: true,
    creationDate: new Date(),
    orders: [buildDefaultDcaTradingOrder(randomBoolean()), buildDefaultDcaTradingOrder(randomBoolean()), buildDefaultDcaTradingOrder(randomBoolean())],
  };
};

export const buildDefaultDcaTradingOrder = (success: boolean): DcaTradingOrder => {
  return {
    id: success ? randomString(10) : undefined,
    success: success,
    message: success ? undefined : randomString(10),
    baseAsset: randomString(5),
    quoteAsset: randomString(5),
    symbol: randomSymbol(),
    requestedQuantity: randomNumber(1, 1_000),
    executedQuantity: success ? randomNumber(1, 1_000) : undefined,
    executedPrice: success ? randomNumber(1, 1_000) : undefined,
  };
};
