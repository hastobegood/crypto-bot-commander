import { mocked } from 'ts-jest/utils';
import { Order, SendOrderClient } from '@hastobegood/crypto-bot-artillery/order';
import { buildDefaultLimitOrder, buildDefaultMarketOrder } from '@hastobegood/crypto-bot-artillery/test/builders';
import { CreateOrder } from '../../../../src/code/domain/order/model/order';
import { buildDefaultCreateLimitOrder, buildDefaultCreateMarketOrder } from '../../../builders/domain/order/order-test-builder';
import { CreateOrderService } from '../../../../src/code/domain/order/create-order-service';
import { OrderRepository } from '../../../../src/code/domain/order/order-repository';

const sendOrderClientMock = mocked(jest.genMockFromModule<SendOrderClient>('@hastobegood/crypto-bot-artillery'), true);
const orderRepositoryMock = mocked(jest.genMockFromModule<OrderRepository>('../../../../src/code/domain/order/order-repository'), true);

let createOrderService: CreateOrderService;
beforeEach(() => {
  sendOrderClientMock.send = jest.fn();
  orderRepositoryMock.save = jest.fn();

  createOrderService = new CreateOrderService(sendOrderClientMock, orderRepositoryMock);
});

describe('CreateOrderService', () => {
  let createOrder: CreateOrder;
  let order: Order;

  describe('Given a market order to create', () => {
    beforeEach(() => {
      createOrder = buildDefaultCreateMarketOrder();
    });

    describe('When order is created', () => {
      beforeEach(() => {
        order = buildDefaultMarketOrder();
        sendOrderClientMock.send.mockResolvedValue(order);
        orderRepositoryMock.save.mockResolvedValue(order);
      });

      it('Then created order is returned', async () => {
        const result = await createOrderService.create(createOrder);
        expect(result).toEqual(order);

        expect(sendOrderClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = sendOrderClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0]).toEqual({
          exchange: createOrder.exchange,
          symbol: createOrder.symbol,
          side: createOrder.side,
          type: createOrder.type,
          quote: createOrder.quote,
          requestedQuantity: createOrder.requestedQuantity,
          requestedPrice: createOrder.requestedPrice,
        });

        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveParams = orderRepositoryMock.save.mock.calls[0];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual(order);
      });
    });
  });

  describe('Given a limit order to create', () => {
    beforeEach(() => {
      createOrder = buildDefaultCreateLimitOrder();
    });

    describe('When order is created', () => {
      beforeEach(() => {
        order = buildDefaultLimitOrder();
        sendOrderClientMock.send.mockResolvedValue(order);
        orderRepositoryMock.save.mockResolvedValue(order);
      });

      it('Then created order is returned', async () => {
        const result = await createOrderService.create(createOrder);
        expect(result).toEqual(order);

        expect(sendOrderClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = sendOrderClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0]).toEqual({
          exchange: createOrder.exchange,
          symbol: createOrder.symbol,
          side: createOrder.side,
          type: createOrder.type,
          quote: createOrder.quote,
          requestedQuantity: createOrder.requestedQuantity,
          requestedPrice: createOrder.requestedPrice,
        });

        expect(orderRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveParams = orderRepositoryMock.save.mock.calls[0];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual(order);
      });
    });
  });
});
