import { mocked } from 'ts-jest/utils';
import MockDate from 'mockdate';
import { OrderRepository } from '../../../../src/code/domain/order/order-repository';
import { CreateOrder, Order } from '../../../../src/code/domain/order/model/order';
import { buildDefaultCreateLimitOrder, buildDefaultCreateMarketOrder, buildDefaultLimitOrder, buildDefaultMarketOrder } from '../../../builders/domain/order/order-test-builder';
import { CreateOrderService } from '../../../../src/code/domain/order/create-order-service';
import { truncateNumber } from '../../../../src/code/configuration/util/math';
import { GetTickerService } from '../../../../src/code/domain/ticker/get-ticker-service';
import { Ticker } from '../../../../src/code/domain/ticker/model/ticker';
import { buildDefaultTicker } from '../../../builders/domain/ticker/ticker-test-builder';

const getTickerServiceMock = mocked(jest.genMockFromModule<GetTickerService>('../../../../src/code/domain/ticker/get-ticker-service'), true);
const orderRepositoryMock = mocked(jest.genMockFromModule<OrderRepository>('../../../../src/code/domain/order/order-repository'), true);

let createOrderService: CreateOrderService;
beforeEach(() => {
  getTickerServiceMock.getBySymbol = jest.fn();
  orderRepositoryMock.save = jest.fn();

  createOrderService = new CreateOrderService(getTickerServiceMock, orderRepositoryMock);
});

describe('CreateOrderService', () => {
  let creationDate: Date;
  let createOrder: CreateOrder;
  let ticker: Ticker;

  beforeEach(() => {
    creationDate = new Date();
    MockDate.set(creationDate);

    ticker = buildDefaultTicker();
    getTickerServiceMock.getBySymbol.mockResolvedValue(ticker);
  });

  describe('Given a market order to create', () => {
    beforeEach(() => {
      createOrder = buildDefaultCreateMarketOrder();
    });

    describe('When order is created', () => {
      let order: Order;

      beforeEach(() => {
        order = buildDefaultMarketOrder();
        orderRepositoryMock.save.mockResolvedValue(order);
      });

      it('Then created order is returned', async () => {
        const result = await createOrderService.create(createOrder);
        expect(result).toEqual(order);

        expect(getTickerServiceMock.getBySymbol).toHaveBeenCalledTimes(1);
        const getBySymbolParams = getTickerServiceMock.getBySymbol.mock.calls[0];
        expect(getBySymbolParams.length).toEqual(1);
        expect(getBySymbolParams[0]).toEqual(createOrder.symbol);

        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveParams = orderRepositoryMock.save.mock.calls[0];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual({
          id: `${createOrder.symbol}/${createOrder.side}/${createOrder.type}/${creationDate.valueOf()}`,
          symbol: createOrder.symbol,
          side: createOrder.side,
          type: createOrder.type,
          creationDate: creationDate,
          baseAssetQuantity: createOrder.baseAssetQuantity ? truncateNumber(createOrder.baseAssetQuantity, ticker.quantityPrecision) : undefined,
          quoteAssetQuantity: createOrder.quoteAssetQuantity ? truncateNumber(createOrder.quoteAssetQuantity, ticker.quoteAssetPrecision) : undefined,
          status: 'Waiting',
        });
      });

      describe('And order base and quote asset quantity are missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({
              ...createOrder,
              baseAssetQuantity: undefined,
              quoteAssetQuantity: undefined,
            });
            fail();
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a market order without base or quote asset quantity');
          }

          expect(getTickerServiceMock.getBySymbol).toHaveBeenCalledTimes(0);
          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });

      describe('And order base and quote asset quantity are not missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({
              ...createOrder,
              baseAssetQuantity: 10,
              quoteAssetQuantity: 10,
            });
            fail();
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a market order with base and quote asset quantity');
          }

          expect(getTickerServiceMock.getBySymbol).toHaveBeenCalledTimes(0);
          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });

      describe('And order price limit is not missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({
              ...createOrder,
              priceLimit: 10,
            });
            fail();
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a market order with price limit');
          }

          expect(getTickerServiceMock.getBySymbol).toHaveBeenCalledTimes(0);
          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('Given a limit order to create', () => {
    beforeEach(() => {
      createOrder = buildDefaultCreateLimitOrder();
    });

    describe('When order is created', () => {
      let order: Order;

      beforeEach(() => {
        order = buildDefaultLimitOrder();
        orderRepositoryMock.save.mockResolvedValue(order);
      });

      it('Then created order is returned', async () => {
        const result = await createOrderService.create(createOrder);
        expect(result).toEqual(order);

        expect(getTickerServiceMock.getBySymbol).toHaveBeenCalledTimes(1);
        const getBySymbolParams = getTickerServiceMock.getBySymbol.mock.calls[0];
        expect(getBySymbolParams.length).toEqual(1);
        expect(getBySymbolParams[0]).toEqual(createOrder.symbol);

        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveParams = orderRepositoryMock.save.mock.calls[0];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual({
          id: `${createOrder.symbol}/${createOrder.side}/${createOrder.type}/${creationDate.valueOf()}`,
          symbol: createOrder.symbol,
          side: createOrder.side,
          type: createOrder.type,
          creationDate: creationDate,
          baseAssetQuantity: truncateNumber(createOrder.baseAssetQuantity!, ticker.quantityPrecision),
          priceLimit: truncateNumber(createOrder.priceLimit!, ticker.pricePrecision),
          status: 'Waiting',
        });
      });

      describe('And order base asset quantity is missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({
              ...createOrder,
              baseAssetQuantity: undefined,
            });
            fail();
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a limit order without base asset quantity');
          }

          expect(getTickerServiceMock.getBySymbol).toHaveBeenCalledTimes(0);
          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });

      describe('And order quote asset quantity is not missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({
              ...createOrder,
              quoteAssetQuantity: 10,
            });
            fail();
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a limit order with quote asset quantity');
          }

          expect(getTickerServiceMock.getBySymbol).toHaveBeenCalledTimes(0);
          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });

      describe('And order price limit is missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({
              ...createOrder,
              priceLimit: undefined,
            });
            fail();
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a limit order without price limit');
          }

          expect(getTickerServiceMock.getBySymbol).toHaveBeenCalledTimes(0);
          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });
    });
  });
});
