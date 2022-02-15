import { mocked } from 'ts-jest/utils';
import { UpdateAllCandlesticksMessageConsumer } from '../../../../src/code/application/candlestick/update-all-candlesticks-message-consumer';
import { UpdateCandlestickService } from '../../../../src/code/domain/candlestick/update-candlestick-service';
import { PublishCandlestickService } from '../../../../src/code/domain/candlestick/publish-candlestick-service';
import { TriggeredCandlesticksMessage } from '../../../../src/code/infrastructure/candlestick/sqs-candlestick-publisher';
import { buildDefaultTriggeredCandlesticksMessage } from '../../../builders/infrastructure/candlestick/candlestick-message-builder';

const updateCandlestickServiceMock = mocked(jest.genMockFromModule<UpdateCandlestickService>('../../../../src/code/domain/candlestick/update-candlestick-service'), true);
const publishCandlestickServiceMock = mocked(jest.genMockFromModule<PublishCandlestickService>('../../../../src/code/domain/candlestick/publish-candlestick-service'), true);

let updateAllCandlesticksMessageConsumer: UpdateAllCandlesticksMessageConsumer;
beforeEach(() => {
  updateCandlestickServiceMock.updateAllBySymbol = jest.fn();
  publishCandlestickServiceMock.publishUpdatedBySymbol = jest.fn();

  updateAllCandlesticksMessageConsumer = new UpdateAllCandlesticksMessageConsumer(updateCandlestickServiceMock, publishCandlestickServiceMock);
});

describe('UpdateAllCandlesticksMessageConsumer', () => {
  let triggeredCandlesticksMessage: TriggeredCandlesticksMessage;

  beforeEach(() => {
    triggeredCandlesticksMessage = buildDefaultTriggeredCandlesticksMessage();
  });

  describe('Given candlesticks to update for a symbol', () => {
    describe('When update has failed', () => {
      beforeEach(() => {
        updateCandlestickServiceMock.updateAllBySymbol.mockRejectedValue(new Error('Error occurred !'));
      });

      it('Then error is thrown', async () => {
        try {
          await updateAllCandlesticksMessageConsumer.process(triggeredCandlesticksMessage);
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual('Error occurred !');
        }

        expect(updateCandlestickServiceMock.updateAllBySymbol).toHaveBeenCalledTimes(1);
        const updateAllBySymbolParams = updateCandlestickServiceMock.updateAllBySymbol.mock.calls[0];
        expect(updateAllBySymbolParams.length).toEqual(2);
        expect(updateAllBySymbolParams[0]).toEqual(triggeredCandlesticksMessage.content.exchange);
        expect(updateAllBySymbolParams[1]).toEqual(triggeredCandlesticksMessage.content.symbol);

        expect(publishCandlestickServiceMock.publishUpdatedBySymbol).toHaveBeenCalledTimes(0);
      });
    });

    describe('When update has succeeded', () => {
      beforeEach(() => {
        updateCandlestickServiceMock.updateAllBySymbol = jest.fn().mockReturnValue({});
      });

      it('Then nothing is returned', async () => {
        await updateAllCandlesticksMessageConsumer.process(triggeredCandlesticksMessage);

        expect(updateCandlestickServiceMock.updateAllBySymbol).toHaveBeenCalledTimes(1);
        const updateAllBySymbolParams = updateCandlestickServiceMock.updateAllBySymbol.mock.calls[0];
        expect(updateAllBySymbolParams.length).toEqual(2);
        expect(updateAllBySymbolParams[0]).toEqual(triggeredCandlesticksMessage.content.exchange);
        expect(updateAllBySymbolParams[1]).toEqual(triggeredCandlesticksMessage.content.symbol);

        expect(publishCandlestickServiceMock.publishUpdatedBySymbol).toHaveBeenCalledTimes(1);
        const publishUpdatedBySymbolParams = publishCandlestickServiceMock.publishUpdatedBySymbol.mock.calls[0];
        expect(publishUpdatedBySymbolParams.length).toEqual(2);
        expect(publishUpdatedBySymbolParams[0]).toEqual(triggeredCandlesticksMessage.content.exchange);
        expect(publishUpdatedBySymbolParams[1]).toEqual(triggeredCandlesticksMessage.content.symbol);
      });
    });
  });
});
