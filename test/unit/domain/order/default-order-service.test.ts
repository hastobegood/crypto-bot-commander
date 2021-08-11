import { mocked } from 'ts-jest/utils';
import MockDate from 'mockdate';
import { OrderRepository } from '../../../../src/code/domain/order/order-repository';
import { DefaultOrderService } from '../../../../src/code/domain/order/default-order-service';
import { CreateOrder, Order, OrderType } from '../../../../src/code/domain/order/model/order';
import { buildDefaultCreateOrder, buildDefaultOrder } from '../../../builders/domain/order/order-test-builder';

const orderRepositoryMock = mocked(jest.genMockFromModule<OrderRepository>('../../../../src/code/domain/order/order-repository'), true);

let orderService: DefaultOrderService;
beforeEach(() => {
  orderService = new DefaultOrderService(orderRepositoryMock);
});

describe('DefaultOrderService', () => {
  describe('Given a market order to create', () => {
    let creationDate: Date;
    let createOrder: CreateOrder;

    beforeEach(() => {
      creationDate = new Date();
      createOrder = { ...buildDefaultCreateOrder(), type: OrderType.MARKET };

      orderRepositoryMock.save = jest.fn();
      MockDate.set(creationDate);
    });

    describe('When order quote asset quantity is missing', () => {
      afterEach(() => {
        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
      });

      it('Then error is thrown', async () => {
        try {
          await orderService.create({ ...createOrder, quoteAssetQuantity: undefined });
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Unable to create a market order without quote asset quantity');
        }
      });
    });

    describe('When order creation has succeeded', () => {
      let order: Order;

      beforeEach(() => {
        order = buildDefaultOrder();
        orderRepositoryMock.save.mockResolvedValue(order);
      });

      afterEach(() => {
        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(1);
      });

      it('Then created order is returned', async () => {
        const result = await orderService.create(createOrder);
        expect(result).toBeDefined();
        expect(result).toEqual(order);

        const saveParams = orderRepositoryMock.save.mock.calls[0][0];
        expect(saveParams.id).toEqual(`${createOrder.symbol}/${createOrder.side}/${createOrder.type}/${creationDate.valueOf()}`);
        expect(saveParams.symbol).toEqual(createOrder.symbol);
        expect(saveParams.side).toEqual(createOrder.side);
        expect(saveParams.type).toEqual(createOrder.type);
        expect(saveParams.creationDate).toEqual(creationDate);
        expect(saveParams.transactionDate).toBeUndefined();
        expect(saveParams.baseAssetQuantity).toBeUndefined();
        expect(saveParams.quoteAssetQuantity).toEqual(createOrder.quoteAssetQuantity);
        expect(saveParams.priceThreshold).toBeUndefined();
        expect(saveParams.executedAssetQuantity).toBeUndefined();
        expect(saveParams.status).toEqual('WAITING');
        expect(saveParams.fills).toBeUndefined();
      });
    });

    describe('When order quote asset quantity has more than 8 decimals', () => {
      it('Then order quote asset quantity is rounded half up', async () => {
        createOrder.quoteAssetQuantity = 0.0000000159999;

        await orderService.create(createOrder);

        const saveParams = orderRepositoryMock.save.mock.calls[0][0];
        expect(saveParams.quoteAssetQuantity).toEqual(0.00000002);
      });

      it('Then order quote asset quantity is rounded half down', async () => {
        createOrder.quoteAssetQuantity = 0.0000000149999;

        await orderService.create(createOrder);

        const saveParams = orderRepositoryMock.save.mock.calls[0][0];
        expect(saveParams.quoteAssetQuantity).toEqual(0.00000001);
      });
    });
  });

  describe('Given a take profit order to create', () => {
    let creationDate: Date;
    let createOrder: CreateOrder;

    beforeEach(() => {
      creationDate = new Date();
      createOrder = { ...buildDefaultCreateOrder(), type: OrderType.TAKE_PROFIT };

      MockDate.set(creationDate);
    });

    describe('When order base asset quantity is missing', () => {
      afterEach(() => {
        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
      });

      it('Then error is thrown', async () => {
        try {
          await orderService.create({ ...createOrder, baseAssetQuantity: undefined });
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Unable to create a take profit order without base asset quantity');
        }
      });
    });

    describe('When order price threshold is missing', () => {
      afterEach(() => {
        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(0);
      });

      it('Then error is thrown', async () => {
        try {
          await orderService.create({ ...createOrder, priceThreshold: undefined });
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Unable to create a take profit order without price threshold');
        }
      });
    });

    describe('When order creation has succeeded', () => {
      let order: Order;

      beforeEach(() => {
        order = buildDefaultOrder();
        orderRepositoryMock.save.mockResolvedValue(order);
      });

      afterEach(() => {
        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(1);
      });

      it('Then created order is returned', async () => {
        const result = await orderService.create(createOrder);
        expect(result).toBeDefined();
        expect(result).toEqual(order);

        const saveParams = orderRepositoryMock.save.mock.calls[0][0];
        expect(saveParams.id).toEqual(`${createOrder.symbol}/${createOrder.side}/${createOrder.type}/${creationDate.valueOf()}`);
        expect(saveParams.symbol).toEqual(createOrder.symbol);
        expect(saveParams.side).toEqual(createOrder.side);
        expect(saveParams.type).toEqual(createOrder.type);
        expect(saveParams.creationDate).toEqual(creationDate);
        expect(saveParams.transactionDate).toBeUndefined();
        expect(saveParams.baseAssetQuantity).toEqual(createOrder.baseAssetQuantity);
        expect(saveParams.quoteAssetQuantity).toBeUndefined();
        expect(saveParams.priceThreshold).toEqual(createOrder.priceThreshold);
        expect(saveParams.executedAssetQuantity).toBeUndefined();
        expect(saveParams.status).toEqual('WAITING');
        expect(saveParams.fills).toBeUndefined();
      });
    });

    describe('When order base asset quantity has more than 8 decimals', () => {
      it('Then order base asset quantity is rounded half up', async () => {
        createOrder.baseAssetQuantity = 0.0000000159999;

        await orderService.create(createOrder);

        const saveParams = orderRepositoryMock.save.mock.calls[0][0];
        expect(saveParams.baseAssetQuantity).toEqual(0.00000002);
      });

      it('Then order base asset quantity is rounded half down', async () => {
        createOrder.baseAssetQuantity = 0.0000000149999;

        await orderService.create(createOrder);

        const saveParams = orderRepositoryMock.save.mock.calls[0][0];
        expect(saveParams.baseAssetQuantity).toEqual(0.00000001);
      });
    });
  });
});
