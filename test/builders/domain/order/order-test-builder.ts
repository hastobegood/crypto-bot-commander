import { CreateOrder, Order, StatusOrder } from '../../../../src/code/domain/order/model/order';
import { randomBoolean, randomFromList, randomNumber, randomString, randomSymbol } from '../../random-test-builder';

export const buildDefaultCreateMarketOrder = (): CreateOrder => {
  return {
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'Market',
    quoteAssetQuantity: randomNumber(1, 1_000),
  };
};

export const buildDefaultCreateLimitOrder = (): CreateOrder => {
  return {
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'Limit',
    baseAssetQuantity: randomNumber(1, 1_000),
    priceLimit: randomNumber(1, 1_000),
  };
};

export const buildDefaultOrder = (): Order => {
  return {
    id: randomString(20),
    externalId: randomString(20),
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'Market',
    creationDate: new Date(),
    transactionDate: new Date(),
    quoteAssetQuantity: randomNumber(100, 1_000),
    executedAssetQuantity: randomNumber(1, 100),
    executedPrice: randomNumber(10, 1_000),
    status: 'Filled',
    externalStatus: 'FILLED',
  };
};

export const buildDefaultMarketOrder = (): Order => {
  const baseAsset = randomBoolean();
  return {
    id: randomString(20),
    externalId: randomString(20),
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'Market',
    creationDate: new Date(),
    transactionDate: new Date(),
    baseAssetQuantity: baseAsset ? randomNumber(100, 1_000) : undefined,
    quoteAssetQuantity: baseAsset ? undefined : randomNumber(100, 1_000),
    executedAssetQuantity: randomNumber(1, 100),
    executedPrice: randomNumber(10, 1_000),
    status: 'Filled',
    externalStatus: 'FILLED',
  };
};

export const buildDefaultLimitOrder = (): Order => {
  return {
    id: randomString(20),
    externalId: randomString(20),
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'Limit',
    creationDate: new Date(),
    transactionDate: new Date(),
    baseAssetQuantity: randomNumber(100, 1_000),
    priceLimit: randomNumber(10, 1_000),
    executedAssetQuantity: randomNumber(1, 100),
    executedPrice: randomNumber(10, 1_000),
    status: 'Filled',
    externalStatus: 'FILLED',
  };
};

export const buildDefaultStatusOrder = (): StatusOrder => {
  return {
    side: randomFromList(['Buy', 'Sell']),
    status: 'Filled',
    externalId: randomString(20),
    externalStatus: randomString(10),
    executedAssetQuantity: randomNumber(1, 100),
    executedPrice: randomNumber(10, 1_000),
  };
};
