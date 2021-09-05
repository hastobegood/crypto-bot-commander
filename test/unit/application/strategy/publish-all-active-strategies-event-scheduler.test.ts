import { mocked } from 'ts-jest/utils';
import { PublishStrategyService } from '../../../../src/code/domain/strategy/publish-strategy-service';
import { PublishAllActiveStrategiesEventScheduler } from '../../../../src/code/application/strategy/publish-all-active-strategies-event-scheduler';

const publishStrategyServiceMock = mocked(jest.genMockFromModule<PublishStrategyService>('../../../../src/code/domain/strategy/publish-strategy-service'), true);

let publishAllActiveStrategiesEventScheduler: PublishAllActiveStrategiesEventScheduler;
beforeEach(() => {
  publishStrategyServiceMock.publishAllWithStatusActive = jest.fn();

  publishAllActiveStrategiesEventScheduler = new PublishAllActiveStrategiesEventScheduler(publishStrategyServiceMock);
});

describe('PublishAllActiveStrategiesEventScheduler', () => {
  describe('Given all active strategies publication to process', () => {
    describe('When publication has failed', () => {
      beforeEach(() => {
        publishStrategyServiceMock.publishAllWithStatusActive.mockRejectedValue(new Error('Error occurred !'));
      });

      it('Then error is thrown', async () => {
        try {
          await publishAllActiveStrategiesEventScheduler.process();
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error occurred !');
        }

        expect(publishStrategyServiceMock.publishAllWithStatusActive).toHaveBeenCalledTimes(1);
        const tradeParams = publishStrategyServiceMock.publishAllWithStatusActive.mock.calls[0];
        expect(tradeParams.length).toEqual(0);
      });
    });

    describe('When publication has succeeded', () => {
      beforeEach(() => {
        publishStrategyServiceMock.publishAllWithStatusActive = jest.fn().mockReturnValue({});
      });

      it('Then nothing is returned', async () => {
        await publishAllActiveStrategiesEventScheduler.process();

        expect(publishStrategyServiceMock.publishAllWithStatusActive).toHaveBeenCalledTimes(1);
        const tradeParams = publishStrategyServiceMock.publishAllWithStatusActive.mock.calls[0];
        expect(tradeParams.length).toEqual(0);
      });
    });
  });
});
