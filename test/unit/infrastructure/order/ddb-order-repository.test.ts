import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Order } from '@hastobegood/crypto-bot-artillery/order';
import { buildDefaultOrder } from '@hastobegood/crypto-bot-artillery/test/builders';
import { mocked } from 'ts-jest/utils';

import { OrderRepository } from '../../../../src/code/domain/order/order-repository';
import { DdbOrderRepository } from '../../../../src/code/infrastructure/order/ddb-order-repository';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDBDocumentClient>('@aws-sdk/lib-dynamodb'), true);

let orderRepository: OrderRepository;
beforeEach(() => {
  ddbClientMock.send = jest.fn();

  orderRepository = new DdbOrderRepository('my-table', ddbClientMock);
});

describe('DdbOrderRepository', () => {
  let order: Order;

  describe('Given an order to save', () => {
    beforeEach(() => {
      order = buildDefaultOrder();
    });

    describe('When order is saved', () => {
      it('Then saved order is returned', async () => {
        const result = await orderRepository.save(order);
        expect(result).toEqual(order);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Item: {
            pk: `Order::${order.id}`,
            sk: 'Details',
            type: 'Order',
            data: {
              ...order,
              creationDate: order.creationDate.toISOString(),
              transactionDate: order.transactionDate.toISOString(),
            },
          },
        });
      });
    });
  });

  describe('Given an order status to update by its ID', () => {
    describe('When order is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => {
          throw new Error('Error !');
        });
      });

      it('Then error is thrown', async () => {
        try {
          await orderRepository.updateStatusById('123', 'Filled', 'FILLED', 100, 10);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual(`Unable to update order '123' status: Error !`);
        }

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: `Order::123`,
            sk: 'Details',
          },
          UpdateExpression: 'SET #data.#status = :status, #data.#externalStatus = :externalStatus, #data.#executedAssetQuantity = :executedAssetQuantity, #data.#executedPrice = :executedPrice',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#status': 'status',
            '#externalStatus': 'externalStatus',
            '#executedAssetQuantity': 'executedAssetQuantity',
            '#executedPrice': 'executedPrice',
          },
          ExpressionAttributeValues: {
            ':status': 'Filled',
            ':externalStatus': 'FILLED',
            ':executedAssetQuantity': 100,
            ':executedPrice': 10,
          },
        });
      });
    });

    describe('When order is found', () => {
      it('Then updated order is returned', async () => {
        await orderRepository.updateStatusById('123', 'Filled', 'FILLED', 100, 10);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: `Order::123`,
            sk: 'Details',
          },
          UpdateExpression: 'SET #data.#status = :status, #data.#externalStatus = :externalStatus, #data.#executedAssetQuantity = :executedAssetQuantity, #data.#executedPrice = :executedPrice',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#status': 'status',
            '#externalStatus': 'externalStatus',
            '#executedAssetQuantity': 'executedAssetQuantity',
            '#executedPrice': 'executedPrice',
          },
          ExpressionAttributeValues: {
            ':status': 'Filled',
            ':externalStatus': 'FILLED',
            ':executedAssetQuantity': 100,
            ':executedPrice': 10,
          },
        });
      });
    });
  });
});
