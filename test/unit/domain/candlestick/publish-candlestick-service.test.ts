import { CandlestickPublisher } from '../../../../src/code/domain/candlestick/candlestick-publisher';
import { PublishCandlestickService } from '../../../../src/code/domain/candlestick/publish-candlestick-service';

const candlestickPublisherMock = jest.mocked(jest.genMockFromModule<CandlestickPublisher>('../../../../src/code/domain/candlestick/candlestick-publisher'), true);

let publishStrategyService: PublishCandlestickService;
beforeEach(() => {
  candlestickPublisherMock.publishTriggeredBySymbol = jest.fn();
  candlestickPublisherMock.publishUpdatedBySymbol = jest.fn();

  publishStrategyService = new PublishCandlestickService(candlestickPublisherMock);
});

describe('PublishCandlestickService', () => {
  describe('Given triggered candlesticks by symbol to publish', () => {
    afterEach(() => {
      expect(candlestickPublisherMock.publishUpdatedBySymbol).toHaveBeenCalledTimes(0);
    });

    it('Then triggered candlesticks symbol is published', async () => {
      await publishStrategyService.publishTriggeredBySymbol('Binance', 'ABC');

      expect(candlestickPublisherMock.publishTriggeredBySymbol).toHaveBeenCalledTimes(1);
      const publishTriggeredBySymbolParams = candlestickPublisherMock.publishTriggeredBySymbol.mock.calls[0];
      expect(publishTriggeredBySymbolParams.length).toEqual(2);
      expect(publishTriggeredBySymbolParams[0]).toEqual('Binance');
      expect(publishTriggeredBySymbolParams[1]).toEqual('ABC');
    });
  });

  describe('Given updated candlesticks by symbol to publish', () => {
    afterEach(() => {
      expect(candlestickPublisherMock.publishTriggeredBySymbol).toHaveBeenCalledTimes(0);
    });

    it('Then updated candlesticks symbol is published', async () => {
      await publishStrategyService.publishUpdatedBySymbol('Binance', 'ABC');

      expect(candlestickPublisherMock.publishUpdatedBySymbol).toHaveBeenCalledTimes(1);
      const publishUpdatedBySymbolParams = candlestickPublisherMock.publishUpdatedBySymbol.mock.calls[0];
      expect(publishUpdatedBySymbolParams.length).toEqual(2);
      expect(publishUpdatedBySymbolParams[0]).toEqual('Binance');
      expect(publishUpdatedBySymbolParams[1]).toEqual('ABC');
    });
  });
});
