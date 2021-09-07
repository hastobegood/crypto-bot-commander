import { buildDefaultDcaTradingConfig } from '../../../builders/domain/dca-trading/dca-trading-test-builder';
import { mocked } from 'ts-jest/utils';
import { DcaTradingEventScheduler } from '../../../../src/code/application/dca-trading/dca-trading-event-scheduler';
import { ProcessDcaTradingService } from '../../../../src/code/domain/dca-trading/process-dca-trading-service';

const dcaTradingConfig = buildDefaultDcaTradingConfig();
const processDcaTradingServiceMock = mocked(jest.genMockFromModule<ProcessDcaTradingService>('../../../../src/code/domain/dca-trading/process-dca-trading-service'), true);

let dcaTradingEventScheduler: DcaTradingEventScheduler;
beforeEach(() => {
  processDcaTradingServiceMock.process = jest.fn();

  dcaTradingEventScheduler = new DcaTradingEventScheduler(processDcaTradingServiceMock, dcaTradingConfig);
});

describe('DcaTradingScheduler', () => {
  describe('Given a DCA trading config to process', () => {
    describe('When DCA trading has failed', () => {
      beforeEach(() => {
        processDcaTradingServiceMock.process.mockRejectedValue(new Error('Error occurred !'));
      });

      it('Then error is thrown', async () => {
        try {
          await dcaTradingEventScheduler.process();
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error occurred !');
        }

        expect(processDcaTradingServiceMock.process).toHaveBeenCalledTimes(1);
        const tradeParams = processDcaTradingServiceMock.process.mock.calls[0];
        expect(tradeParams.length).toEqual(1);
        expect(tradeParams[0]).toEqual(dcaTradingConfig);
      });
    });

    describe('When DCA trading has succeeded', () => {
      beforeEach(() => {
        processDcaTradingServiceMock.process = jest.fn().mockReturnValue({});
      });

      it('Then nothing is returned', async () => {
        await dcaTradingEventScheduler.process();

        expect(processDcaTradingServiceMock.process).toHaveBeenCalledTimes(1);
        const tradeParams = processDcaTradingServiceMock.process.mock.calls[0];
        expect(tradeParams.length).toEqual(1);
        expect(tradeParams[0]).toEqual(dcaTradingConfig);
      });
    });
  });
});
