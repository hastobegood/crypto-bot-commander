import { buildDefaultDcaTradingConfig } from '../../../builders/domain/dca-trading/dca-trading-test-builder';
import { mocked } from 'ts-jest/utils';
import { DcaTradingScheduler } from '../../../../src/code/application/dca-trading/dca-trading-scheduler';
import { DcaTradingService } from '../../../../src/code/domain/dca-trading/dca-trading-service';
import { AccountService } from '../../../../src/code/domain/account/account-service';

const dcaTradingConfig = buildDefaultDcaTradingConfig();
const accountServiceMock = mocked(jest.genMockFromModule<AccountService>('../../../../src/code/domain/account/account-service'), true);
const dcaTradingServiceMock = mocked(jest.genMockFromModule<DcaTradingService>('../../../../src/code/domain/dca-trading/dca-trading-service'), true);

let dcaTradingScheduler: DcaTradingScheduler;
beforeEach(() => {
  dcaTradingScheduler = new DcaTradingScheduler(accountServiceMock, dcaTradingServiceMock, dcaTradingConfig);
});

describe('DcaTradingScheduler', () => {
  describe('Given a DCA trading config to trade', () => {
    beforeEach(() => {
      accountServiceMock.getAccount = jest.fn();
    });

    describe('When DCA trading has failed', () => {
      beforeEach(() => {
        dcaTradingServiceMock.trade = jest.fn().mockRejectedValue(new Error('Error occurred !'));
      });

      afterEach(() => {
        expect(accountServiceMock.getAccount).toHaveBeenCalledTimes(1);
        expect(dcaTradingServiceMock.trade).toHaveBeenCalledTimes(1);
      });

      it('Then error is thrown', async () => {
        try {
          await dcaTradingScheduler.trade();
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Error occurred !');
        }

        const tradeParams = dcaTradingServiceMock.trade.mock.calls[0][0];
        expect(tradeParams).toBeDefined();
        expect(tradeParams).toEqual(dcaTradingConfig);
      });
    });

    describe('When DCA trading has succeeded', () => {
      beforeEach(() => {
        dcaTradingServiceMock.trade = jest.fn().mockReturnValue({});
      });

      afterEach(() => {
        expect(accountServiceMock.getAccount).toHaveBeenCalledTimes(2);
        expect(dcaTradingServiceMock.trade).toHaveBeenCalledTimes(1);
      });

      it('Then nothing is returned', async () => {
        await dcaTradingScheduler.trade();

        const tradeParams = dcaTradingServiceMock.trade.mock.calls[0][0];
        expect(tradeParams).toBeDefined();
        expect(tradeParams).toEqual(dcaTradingConfig);
      });
    });
  });
});
