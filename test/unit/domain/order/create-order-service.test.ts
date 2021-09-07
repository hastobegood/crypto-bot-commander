import { mocked } from 'ts-jest/utils';
import MockDate from 'mockdate';
import { OrderRepository } from '../../../../src/code/domain/order/order-repository';
import { CreateOrder, Order } from '../../../../src/code/domain/order/model/order';
import { buildDefaultCreateMarketOrder, buildDefaultCreateTakeProfitOrder, buildDefaultOrder } from '../../../builders/domain/order/order-test-builder';
import { CreateOrderService } from '../../../../src/code/domain/order/create-order-service';

const orderRepositoryMock = mocked(jest.genMockFromModule<OrderRepository>('../../../../src/code/domain/order/order-repository'), true);

let createOrderService: CreateOrderService;
beforeEach(() => {
  orderRepositoryMock.save = jest.fn();

  createOrderService = new CreateOrderService(orderRepositoryMock);
});

describe('CreateOrderService', () => {
  let creationDate: Date;
  let createOrder: CreateOrder;

  beforeEach(() => {
    creationDate = new Date();
    MockDate.set(creationDate);
  });

  describe('Given a market order to create', () => {
    beforeEach(() => {
      createOrder = buildDefaultCreateMarketOrder();
    });

    describe('When order is created', () => {
      let order: Order;

      beforeEach(() => {
        order = buildDefaultOrder();
        orderRepositoryMock.save.mockResolvedValue(order);
      });

      it('Then created order is returned', async () => {
        const result = await createOrderService.create(createOrder);
        expect(result).toEqual(order);

        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveParams = orderRepositoryMock.save.mock.calls[0];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual({
          id: `${createOrder.symbol}/${createOrder.side}/${createOrder.type}/${creationDate.valueOf()}`,
          symbol: createOrder.symbol,
          side: createOrder.side,
          type: createOrder.type,
          creationDate: creationDate,
          baseAssetQuantity: createOrder.baseAssetQuantity,
          quoteAssetQuantity: createOrder.quoteAssetQuantity,
          status: 'Waiting',
        });
      });

      describe('And order base and quote asset quantity are missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({ ...createOrder, baseAssetQuantity: undefined, quoteAssetQuantity: undefined });
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a market order without base or quote asset quantity');
          }

          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });

      describe('And order base and quote asset quantity are not missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({ ...createOrder, baseAssetQuantity: 10, quoteAssetQuantity: 10 });
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a market order with base and quote asset quantity');
          }

          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });

      describe('And order quote asset quantity has more than 8 decimals', () => {
        it('Then order quote asset quantity is rounded half up', async () => {
          createOrder.quoteAssetQuantity = 0.0000000159999;

          await createOrderService.create(createOrder);

          const saveParams = orderRepositoryMock.save.mock.calls[0][0];
          expect(saveParams.quoteAssetQuantity).toEqual(0.00000002);
        });

        it('Then order quote asset quantity is rounded half down', async () => {
          createOrder.quoteAssetQuantity = 0.0000000149999;

          await createOrderService.create(createOrder);

          const saveParams = orderRepositoryMock.save.mock.calls[0][0];
          expect(saveParams.quoteAssetQuantity).toEqual(0.00000001);
        });
      });

      describe('And order base asset quantity has more than 8 decimals', () => {
        it('Then order base asset quantity is rounded half up', async () => {
          createOrder.baseAssetQuantity = 0.0000000159999;
          createOrder.quoteAssetQuantity = undefined;

          await createOrderService.create(createOrder);

          const saveParams = orderRepositoryMock.save.mock.calls[0][0];
          expect(saveParams.baseAssetQuantity).toEqual(0.00000002);
        });

        it('Then order quote asset quantity is rounded half down', async () => {
          createOrder.baseAssetQuantity = 0.0000000149999;
          createOrder.quoteAssetQuantity = undefined;

          await createOrderService.create(createOrder);

          const saveParams = orderRepositoryMock.save.mock.calls[0][0];
          expect(saveParams.baseAssetQuantity).toEqual(0.00000001);
        });
      });
    });
  });

  describe('Given a take profit order to create', () => {
    beforeEach(() => {
      createOrder = buildDefaultCreateTakeProfitOrder();
    });

    describe('When order is created', () => {
      let order: Order;

      beforeEach(() => {
        order = buildDefaultOrder();
        orderRepositoryMock.save.mockResolvedValue(order);
      });

      it('Then created order is returned', async () => {
        const result = await createOrderService.create(createOrder);
        expect(result).toEqual(order);

        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveParams = orderRepositoryMock.save.mock.calls[0];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual({
          id: `${createOrder.symbol}/${createOrder.side}/${createOrder.type}/${creationDate.valueOf()}`,
          symbol: createOrder.symbol,
          side: createOrder.side,
          type: createOrder.type,
          creationDate: creationDate,
          baseAssetQuantity: createOrder.baseAssetQuantity,
          priceThreshold: createOrder.priceThreshold,
          status: 'Waiting',
        });
      });

      describe('And order base asset quantity is missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({ ...createOrder, baseAssetQuantity: undefined });
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a take profit order without base asset quantity');
          }

          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });

      describe('And order price threshold is missing', () => {
        it('Then error is thrown', async () => {
          try {
            await createOrderService.create({ ...createOrder, priceThreshold: undefined });
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to create a take profit order without price threshold');
          }

          expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
        });
      });

      describe('And order base asset quantity has more than 8 decimals', () => {
        it('Then order base asset quantity is rounded half up', async () => {
          createOrder.baseAssetQuantity = 0.0000000159999;

          await createOrderService.create(createOrder);

          const saveParams = orderRepositoryMock.save.mock.calls[0][0];
          expect(saveParams.baseAssetQuantity).toEqual(0.00000002);
        });

        it('Then order base asset quantity is rounded half down', async () => {
          createOrder.baseAssetQuantity = 0.0000000149999;

          await createOrderService.create(createOrder);

          const saveParams = orderRepositoryMock.save.mock.calls[0][0];
          expect(saveParams.baseAssetQuantity).toEqual(0.00000001);
        });
      });
    });
  });
});
