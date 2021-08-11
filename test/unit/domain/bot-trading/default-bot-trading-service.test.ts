import { mocked } from 'ts-jest/utils';
import { OrderService } from '../../../../src/code/domain/order/order-service';
import { DefaultBotTradingService } from '../../../../src/code/domain/bot-trading/default-bot-trading-service';
import { PriceService } from '../../../../src/code/domain/price/price-service';
import { BotTradingRepository } from '../../../../src/code/domain/bot-trading/bot-trading-repository';
import { BotTrading, BotTradingConfig } from '../../../../src/code/domain/bot-trading/model/bot-trading';
import { buildBotTradingConfig, buildDefaultBotTrading } from '../../../builders/domain/bot-trading/bot-trading-test-builder';
import { Price } from '../../../../src/code/domain/price/model/price';
import { buildPrice } from '../../../builders/domain/price/price-test-builder';
import { Order, OrderSide, OrderType } from '../../../../src/code/domain/order/model/order';
import { buildDefaultOrder } from '../../../builders/domain/order/order-test-builder';
import MockDate from 'mockdate';
import { roundNumber } from '../../../../src/code/configuration/util/math';

const priceServiceMock = mocked(jest.genMockFromModule<PriceService>('../../../../src/code/domain/price/price-service'), true);
const orderServiceMock = mocked(jest.genMockFromModule<OrderService>('../../../../src/code/domain/order/order-service'), true);
const botTradingRepositoryMock = mocked(jest.genMockFromModule<BotTradingRepository>('../../../../src/code/domain/bot-trading/bot-trading-repository'), true);

const buyPercentage = -0.03;
const sellPercentage = +0.03;
const dumpPercentage = -0.002;

let botTradingService: DefaultBotTradingService;
beforeEach(() => {
  priceServiceMock.getBySymbol = jest.fn();
  botTradingRepositoryMock.getLast = jest.fn();
  botTradingRepositoryMock.save = jest.fn();
  orderServiceMock.create = jest.fn();
  botTradingService = new DefaultBotTradingService(priceServiceMock, orderServiceMock, botTradingRepositoryMock);
});

describe('DefaultBotTradingService', () => {
  let creationDate: Date;
  let botTradingConfig: BotTradingConfig;
  let price: Price;
  let buyOrder: Order;
  let sellOrder: Order;

  beforeEach(() => {
    creationDate = new Date();
    botTradingConfig = buildBotTradingConfig(buyPercentage, sellPercentage, dumpPercentage);
    buyOrder = { ...buildDefaultOrder(), executedAssetQuantity: 1.123456789, executedPrice: 99.987654321 };
    sellOrder = buildDefaultOrder();

    orderServiceMock.create.mockResolvedValueOnce(buyOrder).mockResolvedValueOnce(sellOrder);

    MockDate.set(creationDate);
  });

  afterEach(() => {
    expect(priceServiceMock.getBySymbol).toHaveBeenCalledTimes(1);
    expect(botTradingRepositoryMock.getLast).toHaveBeenCalledTimes(1);
  });

  describe('Given a BOT trading config to trade while a dump is in progress', () => {
    beforeEach(() => {
      price = buildPrice(`${botTradingConfig.baseAsset}${botTradingConfig.quoteAsset}`, 100 / dumpPercentage, 100);
      priceServiceMock.getBySymbol.mockResolvedValue(price);
    });

    describe('When there is no last buy order', () => {
      beforeEach(() => {
        botTradingRepositoryMock.getLast.mockResolvedValue(null);
      });

      it('Then buy and sell orders are created', async () => {
        await botTradingService.trade(botTradingConfig);

        expect(orderServiceMock.create).toHaveBeenCalledTimes(2);
        checkCreateOrderParams(botTradingConfig, price.symbol, buyOrder, sellOrder, creationDate);
      });
    });

    describe('When there is a last buy order', () => {
      let lastBotTrading: BotTrading;

      beforeEach(() => {
        lastBotTrading = buildDefaultBotTrading();
        botTradingRepositoryMock.getLast.mockResolvedValue(lastBotTrading);
      });

      describe('And price change percentage is > +3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + sellPercentage + 0.0001); // +3.01%
        });

        it('Then buy and sell orders are created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(2);
          checkCreateOrderParams(botTradingConfig, price.symbol, buyOrder, sellOrder, creationDate);
        });
      });

      describe('And price change percentage is = +3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + sellPercentage + 0.0001); // +3.00%
        });

        it('Then buy and sell orders are created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(2);
          checkCreateOrderParams(botTradingConfig, price.symbol, buyOrder, sellOrder, creationDate);
        });
      });

      describe('And price change percentage is < +3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + sellPercentage - 0.0001); // +2.99%
        });

        it('Then buy and sell orders are not created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And price change percentage is > -3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + buyPercentage + 0.0001); // -2.99%
        });

        it('Then buy and sell orders are not created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And price change percentage is = -3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + buyPercentage); // -3.00%
        });

        it('Then buy and sell orders are not created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And price change percentage is < -3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + buyPercentage - 0.0001); // -3.01%
        });

        it('Then buy and sell orders are not created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('Given a BOT trading config to trade while a dump is not in progress', () => {
    beforeEach(() => {
      price = buildPrice(`${botTradingConfig.baseAsset}${botTradingConfig.quoteAsset}`, 100 / (1 + dumpPercentage + 0.0001), 100); // −0,19%
      priceServiceMock.getBySymbol.mockResolvedValue(price);
    });

    describe('When there is no last buy order', () => {
      beforeEach(() => {
        botTradingRepositoryMock.getLast.mockResolvedValue(null);
      });

      it('Then buy and sell orders are not created', async () => {
        await botTradingService.trade(botTradingConfig);

        expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
      });
    });

    describe('When there is a last buy order', () => {
      let lastBotTrading: BotTrading;

      beforeEach(() => {
        lastBotTrading = buildDefaultBotTrading();
        botTradingRepositoryMock.getLast.mockResolvedValue(lastBotTrading);
      });

      describe('And price change percentage is > +3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + sellPercentage + 0.0001); // +3.01%
        });

        it('Then buy and sell orders are not created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And price change percentage is = +3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + sellPercentage); // +3.00%
        });

        it('Then buy and sell orders are not created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And price change percentage is < +3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + sellPercentage - 0.0001); // +2.99%
        });

        it('Then buy and sell orders are not created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And price change percentage is > -3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + buyPercentage + 0.0001); // -2.99%;
        });

        it('Then buy and sell orders are not created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And price change percentage is = -3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = 100 / (1 + buyPercentage); // -3.00%
        });

        it('Then buy and sell orders are created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(2);
          checkCreateOrderParams(botTradingConfig, price.symbol, buyOrder, sellOrder, creationDate);
        });
      });

      describe('And price change percentage is < -3%', () => {
        beforeEach(() => {
          lastBotTrading.buyOrder.price = price.currentPrice / (1 + buyPercentage - 0.0001); // -3.01%
        });

        it('Then buy and sell orders are created', async () => {
          await botTradingService.trade(botTradingConfig);

          expect(orderServiceMock.create).toHaveBeenCalledTimes(2);
          checkCreateOrderParams(botTradingConfig, price.symbol, buyOrder, sellOrder, creationDate);
        });
      });
    });
  });
});

const checkCreateOrderParams = (botTradingConfig: BotTradingConfig, symbol: string, buyOrder: Order, sellOrder: Order, creationDate: Date) => {
  let createOrderParams = orderServiceMock.create.mock.calls[0][0];
  expect(createOrderParams).toBeDefined();
  expect(createOrderParams.symbol).toEqual(symbol);
  expect(createOrderParams.side).toEqual(OrderSide.BUY);
  expect(createOrderParams.type).toEqual(OrderType.MARKET);
  expect(createOrderParams.baseAssetQuantity).toBeUndefined();
  expect(createOrderParams.quoteAssetQuantity).toEqual(botTradingConfig.quoteAssetQuantity);
  expect(createOrderParams.priceThreshold).toBeUndefined();
  createOrderParams = orderServiceMock.create.mock.calls[1][0];
  expect(createOrderParams).toBeDefined();
  expect(createOrderParams.symbol).toEqual(symbol);
  expect(createOrderParams.side).toEqual(OrderSide.SELL);
  expect(createOrderParams.type).toEqual(OrderType.TAKE_PROFIT);
  expect(createOrderParams.baseAssetQuantity).toEqual(buyOrder.executedAssetQuantity);
  expect(createOrderParams.quoteAssetQuantity).toBeUndefined();
  expect(createOrderParams.priceThreshold).toEqual(roundNumber(buyOrder.executedPrice! * (1 + sellPercentage), 2));

  expect(botTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
  const saveBotTradingParams = botTradingRepositoryMock.save.mock.calls[0][0];
  expect(saveBotTradingParams).toBeDefined();
  expect(saveBotTradingParams.id).toEqual(`${symbol}/${creationDate.valueOf()}`);
  expect(saveBotTradingParams.symbol).toEqual(symbol);
  expect(saveBotTradingParams.creationDate).toEqual(creationDate);
  expect(saveBotTradingParams.evaluation.shouldBuy).toEqual(true);
  expect(saveBotTradingParams.buyOrder).toEqual({ id: buyOrder.id, quantity: buyOrder.executedAssetQuantity, price: buyOrder.executedPrice });
  expect(saveBotTradingParams.sellOrder).toEqual({ id: sellOrder.id, quantity: buyOrder.executedAssetQuantity, price: roundNumber(buyOrder.executedPrice! * (1 + botTradingConfig.sellPercentage), 2) });
};
