import { mocked } from 'ts-jest/utils';

import { TriggerAllCandlesticksEventScheduler } from '../../../../src/code/application/candlestick/trigger-all-candlesticks-event-scheduler';
import { PublishCandlestickService } from '../../../../src/code/domain/candlestick/publish-candlestick-service';

const publishCandlestickServiceMock = mocked(jest.genMockFromModule<PublishCandlestickService>('../../../../src/code/domain/candlestick/publish-candlestick-service'), true);

let triggerAllCandlesticksEventScheduler: TriggerAllCandlesticksEventScheduler;
beforeEach(() => {
  publishCandlestickServiceMock.publishTriggeredBySymbol = jest.fn();

  triggerAllCandlesticksEventScheduler = new TriggerAllCandlesticksEventScheduler(publishCandlestickServiceMock);
});

describe('TriggerAllCandlesticksEventScheduler', () => {
  describe('Given candlesticks to trigger for a symbol', () => {
    describe('When exchange is unknown', () => {
      it('Then error is thrown', async () => {
        try {
          await triggerAllCandlesticksEventScheduler.process('Unknown', 'ABC');
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual("Unsupported 'Unknown' exchange");
        }

        expect(publishCandlestickServiceMock.publishTriggeredBySymbol).toHaveBeenCalledTimes(0);
      });
    });

    describe('When publish has failed', () => {
      beforeEach(() => {
        publishCandlestickServiceMock.publishTriggeredBySymbol.mockRejectedValue(new Error('Error occurred !'));
      });

      it('Then error is thrown', async () => {
        try {
          await triggerAllCandlesticksEventScheduler.process('Binance', 'ABC');
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual('Error occurred !');
        }

        expect(publishCandlestickServiceMock.publishTriggeredBySymbol).toHaveBeenCalledTimes(1);
        const publishTriggeredBySymbolParams = publishCandlestickServiceMock.publishTriggeredBySymbol.mock.calls[0];
        expect(publishTriggeredBySymbolParams.length).toEqual(2);
        expect(publishTriggeredBySymbolParams[0]).toEqual('Binance');
        expect(publishTriggeredBySymbolParams[1]).toEqual('ABC');
      });
    });

    describe('When publish has succeeded', () => {
      beforeEach(() => {
        publishCandlestickServiceMock.publishTriggeredBySymbol = jest.fn().mockReturnValue({});
      });

      it('Then nothing is returned', async () => {
        await triggerAllCandlesticksEventScheduler.process('Binance', 'ABC');

        expect(publishCandlestickServiceMock.publishTriggeredBySymbol).toHaveBeenCalledTimes(1);
        const publishTriggeredBySymbolParams = publishCandlestickServiceMock.publishTriggeredBySymbol.mock.calls[0];
        expect(publishTriggeredBySymbolParams.length).toEqual(2);
        expect(publishTriggeredBySymbolParams[0]).toEqual('Binance');
        expect(publishTriggeredBySymbolParams[1]).toEqual('ABC');
      });
    });
  });
});
