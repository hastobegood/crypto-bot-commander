import { CreateOrder, Order } from '../../../../src/code/domain/order/model/order';
import { randomFromList, randomNumber, randomPercentage, randomString, randomSymbol } from '../../random-test-builder';

export const buildDefaultCreateMarketOrder = (): CreateOrder => {
  return {
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'Market',
    quoteAssetQuantity: randomNumber(1, 1_000),
  };
};

export const buildDefaultCreateTakeProfitOrder = (): CreateOrder => {
  return {
    symbol: randomSymbol(),
    side: 'Buy',
    type: 'TakeProfit',
    baseAssetQuantity: randomNumber(1, 1_000),
    priceThreshold: randomNumber(1, 1_000),
  };
};

export const buildDefaultOrder = (): Order => {
  return {
    id: randomString(20),
    externalId: randomString(20),
    symbol: randomSymbol(),
    side: 'Buy',
    type: randomFromList(['Market', 'TakeProfit']),
    creationDate: new Date(),
    transactionDate: new Date(),
    baseAssetQuantity: randomNumber(100, 1_000),
    quoteAssetQuantity: randomNumber(100, 1_000),
    priceThreshold: randomPercentage(),
    executedAssetQuantity: randomNumber(1, 100),
    executedPrice: randomNumber(10, 1_000),
    status: 'FILLED',
    fills: [
      {
        price: randomNumber(1_000, 1_000_000),
        quantity: randomNumber(1, 1_000),
        commission: randomNumber(1, 10),
        commissionAsset: randomString(5).toUpperCase(),
      },
      {
        price: randomNumber(1_000, 1_000_000),
        quantity: randomNumber(1, 1_000),
        commission: randomNumber(1, 10),
        commissionAsset: randomString(5).toUpperCase(),
      },
    ],
  };
};
