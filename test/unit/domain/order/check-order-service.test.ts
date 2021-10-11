import { mocked } from 'ts-jest/utils';
import { OrderReview } from '../../../../src/code/domain/order/model/order';
import { CheckOrderService } from '../../../../src/code/domain/order/check-order-service';
import { buildDefaultOrderReview } from '../../../builders/domain/order/order-test-builder';
import { OrderClient } from '../../../../src/code/domain/order/order-client';

const orderClientMock = mocked(jest.genMockFromModule<OrderClient>('../../../../src/code/domain/order/order-client'), true);

let checkOrderService: CheckOrderService;
beforeEach(() => {
  orderClientMock.check = jest.fn();

  checkOrderService = new CheckOrderService(orderClientMock);
});

describe('CheckOrderService', () => {
  let review: OrderReview;

  describe('Given an order to check', () => {
    describe('When order is checked', () => {
      beforeEach(() => {
        review = buildDefaultOrderReview();
        orderClientMock.check.mockResolvedValue(review);
      });

      it('Then order review is returned', async () => {
        const result = await checkOrderService.check('ABC', '123');
        expect(result).toEqual(review);

        expect(orderClientMock.check).toHaveBeenCalledTimes(1);
        const checkParams = orderClientMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual('ABC');
        expect(checkParams[1]).toEqual('123');
      });
    });
  });
});
