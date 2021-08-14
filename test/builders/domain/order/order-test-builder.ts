import { CreateOrder, Order, OrderSide, OrderType } from '../../../../src/code/domain/order/model/order';
import { randomFromList, randomNumber, randomPercentage, randomString } from '../../random-test-builder';

export const buildDefaultCreateOrder = (): CreateOrder => {
  return {
    symbol: randomString(5).toUpperCase(),
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    baseAssetQuantity: randomNumber(1, 1_000),
    quoteAssetQuantity: randomNumber(1, 1_000),
    priceThreshold: randomPercentage(),
  };
};

export const buildDefaultOrder = (): Order => {
  return {
    id: randomString(20),
    externalId: randomString(20),
    symbol: randomString(10).toUpperCase(),
    side: OrderSide.BUY,
    type: randomFromList([OrderType.MARKET, OrderType.TAKE_PROFIT]),
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
