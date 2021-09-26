import { mocked } from 'ts-jest/utils';
import { OrderRepository } from '../../../../src/code/domain/order/order-repository';
import { StatusOrder } from '../../../../src/code/domain/order/model/order';
import { StatusOrderService } from '../../../../src/code/domain/order/status-order-service';
import { buildDefaultStatusOrder } from '../../../builders/domain/order/order-test-builder';

const orderRepositoryMock = mocked(jest.genMockFromModule<OrderRepository>('../../../../src/code/domain/order/order-repository'), true);

let statusOrderService: StatusOrderService;
beforeEach(() => {
  orderRepositoryMock.check = jest.fn();

  statusOrderService = new StatusOrderService(orderRepositoryMock);
});

describe('StatusOrderService', () => {
  let statusOrder: StatusOrder;

  describe('Given a status order to check', () => {
    describe('When status order is checked', () => {
      beforeEach(() => {
        statusOrder = buildDefaultStatusOrder();
        orderRepositoryMock.check.mockResolvedValue(statusOrder);
      });

      it('Then status order is returned', async () => {
        const result = await statusOrderService.check('ABC', '123');
        expect(result).toEqual(statusOrder);

        expect(orderRepositoryMock.check).toHaveBeenCalledTimes(1);
        const checkParams = orderRepositoryMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual('ABC');
        expect(checkParams[1]).toEqual('123');
      });
    });
  });
});
