import { mocked } from 'ts-jest/utils';
import { CheckOrderClient, OrderCheckup } from '@hastobegood/crypto-bot-artillery/order';
import { buildDefaultOrderCheckup } from '@hastobegood/crypto-bot-artillery/test/builders';
import { CheckOrderService } from '../../../../src/code/domain/order/check-order-service';

const checkOrderClientMock = mocked(jest.genMockFromModule<CheckOrderClient>('@hastobegood/crypto-bot-artillery'), true);

let checkOrderService: CheckOrderService;
beforeEach(() => {
  checkOrderClientMock.check = jest.fn();

  checkOrderService = new CheckOrderService(checkOrderClientMock);
});

describe('CheckOrderService', () => {
  describe('Given an order to check', () => {
    describe('When order is checked', () => {
      let orderCheckup: OrderCheckup;

      beforeEach(() => {
        orderCheckup = buildDefaultOrderCheckup();
        checkOrderClientMock.check.mockResolvedValue(orderCheckup);
      });

      it('Then order review is returned', async () => {
        const result = await checkOrderService.check('Binance', 'ABC', '123');
        expect(result).toEqual(orderCheckup);

        expect(checkOrderClientMock.check).toHaveBeenCalledTimes(1);
        const checkParams = checkOrderClientMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(1);
        expect(checkParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          externalId: '123',
        });
      });
    });
  });
});
