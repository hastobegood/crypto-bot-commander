import { mocked } from 'ts-jest/utils';

import { OrderRepository } from '../../../../src/code/domain/order/order-repository';
import { UpdateOrderService } from '../../../../src/code/domain/order/update-order-service';

const orderRepositoryMock = mocked(jest.genMockFromModule<OrderRepository>('../../../../src/code/domain/order/order-repository'), true);

let updateOrderService: UpdateOrderService;
beforeEach(() => {
  orderRepositoryMock.updateStatusById = jest.fn();

  updateOrderService = new UpdateOrderService(orderRepositoryMock);
});

describe('UpdateOrderService', () => {
  describe('Given an order status to update by its ID', () => {
    describe('When order status is updated', () => {
      it('Then nothing is returned', async () => {
        await updateOrderService.updateStatusById('666', 'Canceled', 'CANCELED', 10, 20);

        expect(orderRepositoryMock.updateStatusById).toHaveBeenCalledTimes(1);
        const updateStatusByIdParams = orderRepositoryMock.updateStatusById.mock.calls[0];
        expect(updateStatusByIdParams.length).toEqual(5);
        expect(updateStatusByIdParams[0]).toEqual('666');
        expect(updateStatusByIdParams[1]).toEqual('Canceled');
        expect(updateStatusByIdParams[2]).toEqual('CANCELED');
        expect(updateStatusByIdParams[3]).toEqual(10);
        expect(updateStatusByIdParams[4]).toEqual(20);
      });
    });
  });
});
