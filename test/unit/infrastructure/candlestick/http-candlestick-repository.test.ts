import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { HttpCandlestickRepository } from '../../../../src/code/infrastructure/candlestick/http-candlestick-repository';
import { Candlestick } from '../../../../src/code/domain/candlestick/model/candlestick';
import { BinanceSymbolCandlestick } from '../../../../src/code/infrastructure/binance/model/binance-candlestick';
import { buildDefaultBinanceSymbolCandlesticks } from '../../../builders/infrastructure/binance/binance-symbol-candlestick-test-builder';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let candlestickRepository: HttpCandlestickRepository;
beforeEach(() => {
  binanceClientMock.getSymbolCandlesticks = jest.fn();
  candlestickRepository = new HttpCandlestickRepository(binanceClientMock);
});

describe('HttpCandlestickRepository', () => {
  describe('Given a symbol candlesticks to retrieve', () => {
    let binanceSymbolCandlesticks: BinanceSymbolCandlestick[];

    beforeEach(() => {
      binanceSymbolCandlesticks = buildDefaultBinanceSymbolCandlesticks();
    });

    describe('When symbol candlesticks retrieval has succeeded', () => {
      beforeEach(() => {
        binanceClientMock.getSymbolCandlesticks.mockResolvedValue(binanceSymbolCandlesticks);
      });

      it('Then symbol candlesticks are returned', async () => {
        const result = await candlestickRepository.getAllBySymbol('ABC', 1, '1d');
        expect(result).toBeDefined();
        expect(result.length).toEqual(binanceSymbolCandlesticks.length);
        binanceSymbolCandlesticks.forEach((binanceSymbolCandlestick) => expect(result).toContainEqual(convertBinanceSymbolCandlestick(binanceSymbolCandlestick)));

        expect(binanceClientMock.getSymbolCandlesticks).toHaveBeenCalledTimes(1);
        const getSymbolCandlesticksParams = binanceClientMock.getSymbolCandlesticks.mock.calls[0];
        expect(getSymbolCandlesticksParams).toBeDefined();
        expect(getSymbolCandlesticksParams[0]).toEqual('ABC');
      });
    });
  });
});

const convertBinanceSymbolCandlestick = (binanceSymbolCandlestick: BinanceSymbolCandlestick): Candlestick => {
  return {
    openingDate: new Date(binanceSymbolCandlestick.openingDate),
    closingDate: new Date(binanceSymbolCandlestick.closingDate),
    openingPrice: +binanceSymbolCandlestick.openingPrice,
    closingPrice: +binanceSymbolCandlestick.closingPrice,
    lowestPrice: +binanceSymbolCandlestick.lowestPrice,
    highestPrice: +binanceSymbolCandlestick.highestPrice,
  };
};
