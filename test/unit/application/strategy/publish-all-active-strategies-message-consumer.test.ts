import { PublishAllActiveStrategiesMessageConsumer } from '../../../../src/code/application/strategy/publish-all-active-strategies-message-consumer';
import { PublishStrategyService } from '../../../../src/code/domain/strategy/publish-strategy-service';
import { UpdatedCandlesticksMessage } from '../../../../src/code/infrastructure/candlestick/sqs-candlestick-publisher';
import { buildDefaultUpdatedCandlesticksMessage } from '../../../builders/infrastructure/candlestick/candlestick-message-builder';

const publishStrategyServiceMock = jest.mocked(jest.genMockFromModule<PublishStrategyService>('../../../../src/code/domain/strategy/publish-strategy-service'), true);

let publishAllActiveStrategiesMessageConsumer: PublishAllActiveStrategiesMessageConsumer;
beforeEach(() => {
  publishStrategyServiceMock.publishAllBySymbolAndActiveStatus = jest.fn();

  publishAllActiveStrategiesMessageConsumer = new PublishAllActiveStrategiesMessageConsumer(publishStrategyServiceMock);
});

describe('PublishAllActiveStrategiesMessageConsumer', () => {
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
          await publishAllActiveStrategiesMessageConsumer.process(updatedCandlesticksMessage);
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
        await publishAllActiveStrategiesMessageConsumer.process(updatedCandlesticksMessage);

        expect(publishStrategyServiceMock.publishAllBySymbolAndActiveStatus).toHaveBeenCalledTimes(1);
        const publishAllBySymbolAndActiveStatusParams = publishStrategyServiceMock.publishAllBySymbolAndActiveStatus.mock.calls[0];
        expect(publishAllBySymbolAndActiveStatusParams.length).toEqual(1);
        expect(publishAllBySymbolAndActiveStatusParams[0]).toEqual(updatedCandlesticksMessage.content.symbol);
      });
    });
  });
});
