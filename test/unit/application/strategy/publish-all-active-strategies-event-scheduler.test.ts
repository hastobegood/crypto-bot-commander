import { mocked } from 'ts-jest/utils';
import { PublishStrategyService } from '../../../../src/code/domain/strategy/publish-strategy-service';
import { PublishAllActiveStrategiesEventScheduler } from '../../../../src/code/application/strategy/publish-all-active-strategies-event-scheduler';
import { UpdatedCandlesticksMessage } from '../../../../src/code/infrastructure/candlestick/sqs-candlestick-publisher';
import { buildDefaultUpdatedCandlesticksMessage } from '../../../builders/infrastructure/candlestick/candlestick-message-builder';

const publishStrategyServiceMock = mocked(jest.genMockFromModule<PublishStrategyService>('../../../../src/code/domain/strategy/publish-strategy-service'), true);

let publishAllActiveStrategiesEventScheduler: PublishAllActiveStrategiesEventScheduler;
beforeEach(() => {
  publishStrategyServiceMock.publishAllBySymbolAndActiveStatus = jest.fn();

  publishAllActiveStrategiesEventScheduler = new PublishAllActiveStrategiesEventScheduler(publishStrategyServiceMock);
});

describe('PublishAllActiveStrategiesEventScheduler', () => {
  let updatedCandlesticksMessage: UpdatedCandlesticksMessage;

  beforeEach(() => {
    updatedCandlesticksMessage = buildDefaultUpdatedCandlesticksMessage();
  });

  describe('Given all active strategies publication to process', () => {
    describe('When publication has failed', () => {
      beforeEach(() => {
        publishStrategyServiceMock.publishAllBySymbolAndActiveStatus.mockRejectedValue(new Error('Error occurred !'));
      });

      it('Then error is thrown', async () => {
        try {
          await publishAllActiveStrategiesEventScheduler.process(updatedCandlesticksMessage);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error occurred !');
        }

        expect(publishStrategyServiceMock.publishAllBySymbolAndActiveStatus).toHaveBeenCalledTimes(1);
        const publishAllBySymbolAndActiveStatusParams = publishStrategyServiceMock.publishAllBySymbolAndActiveStatus.mock.calls[0];
        expect(publishAllBySymbolAndActiveStatusParams.length).toEqual(1);
        expect(publishAllBySymbolAndActiveStatusParams[0]).toEqual(updatedCandlesticksMessage.content.symbol);
      });
    });

    describe('When publication has succeeded', () => {
      beforeEach(() => {
        publishStrategyServiceMock.publishAllBySymbolAndActiveStatus = jest.fn().mockReturnValue({});
      });

      it('Then nothing is returned', async () => {
        await publishAllActiveStrategiesEventScheduler.process(updatedCandlesticksMessage);

        expect(publishStrategyServiceMock.publishAllBySymbolAndActiveStatus).toHaveBeenCalledTimes(1);
        const publishAllBySymbolAndActiveStatusParams = publishStrategyServiceMock.publishAllBySymbolAndActiveStatus.mock.calls[0];
        expect(publishAllBySymbolAndActiveStatusParams.length).toEqual(1);
        expect(publishAllBySymbolAndActiveStatusParams[0]).toEqual(updatedCandlesticksMessage.content.symbol);
      });
    });
  });
});
