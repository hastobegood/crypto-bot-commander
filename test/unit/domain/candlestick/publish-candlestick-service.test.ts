import { mocked } from 'ts-jest/utils';
import { CandlestickPublisher } from '../../../../src/code/domain/candlestick/candlestick-publisher';
import { PublishCandlestickService } from '../../../../src/code/domain/candlestick/publish-candlestick-service';

const candlestickPublisherMock = mocked(jest.genMockFromModule<CandlestickPublisher>('../../../../src/code/domain/candlestick/candlestick-publisher'), true);

let publishStrategyService: PublishCandlestickService;
beforeEach(() => {
  candlestickPublisherMock.publishUpdatedBySymbol = jest.fn();

  publishStrategyService = new PublishCandlestickService(candlestickPublisherMock);
});

describe('PublishCandlestickService', () => {
  describe('Given updated candlesticks by symbol to publish', () => {
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
