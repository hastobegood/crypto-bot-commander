import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { HttpCandlestickRepository } from '../../../../src/code/infrastructure/candlestick/http-candlestick-repository';
import { BinanceSymbolCandlestick } from '../../../../src/code/infrastructure/binance/model/binance-candlestick';
import { buildDefaultBinanceSymbolCandlestick } from '../../../builders/infrastructure/binance/binance-symbol-candlestick-test-builder';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let candlestickRepository: HttpCandlestickRepository;
beforeEach(() => {
  binanceClientMock.getSymbolCandlesticks = jest.fn();

  candlestickRepository = new HttpCandlestickRepository(binanceClientMock);
});

describe('HttpCandlestickRepository', () => {
  describe('Given all candlesticks to retrieve for a specific symbol', () => {
    let binanceSymbolCandlestick1: BinanceSymbolCandlestick;
    let binanceSymbolCandlestick2: BinanceSymbolCandlestick;
    let binanceSymbolCandlesticks: BinanceSymbolCandlestick[];

    describe('When Binance candlesticks are found', () => {
      beforeEach(() => {
        binanceSymbolCandlestick1 = buildDefaultBinanceSymbolCandlestick();
        binanceSymbolCandlestick2 = buildDefaultBinanceSymbolCandlestick();
        binanceSymbolCandlesticks = [binanceSymbolCandlestick1, binanceSymbolCandlestick2];
        binanceClientMock.getSymbolCandlesticks.mockResolvedValue(binanceSymbolCandlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const result = await candlestickRepository.getAllBySymbol('ABC#DEF', 1, '1d');
        expect(result).toEqual([
          {
            openingDate: new Date(binanceSymbolCandlestick1.openingDate),
            closingDate: new Date(binanceSymbolCandlestick1.closingDate),
            openingPrice: +binanceSymbolCandlestick1.openingPrice,
            closingPrice: +binanceSymbolCandlestick1.closingPrice,
            lowestPrice: +binanceSymbolCandlestick1.lowestPrice,
            highestPrice: +binanceSymbolCandlestick1.highestPrice,
          },
          {
            openingDate: new Date(binanceSymbolCandlestick2.openingDate),
            closingDate: new Date(binanceSymbolCandlestick2.closingDate),
            openingPrice: +binanceSymbolCandlestick2.openingPrice,
            closingPrice: +binanceSymbolCandlestick2.closingPrice,
            lowestPrice: +binanceSymbolCandlestick2.lowestPrice,
            highestPrice: +binanceSymbolCandlestick2.highestPrice,
          },
        ]);

        expect(binanceClientMock.getSymbolCandlesticks).toHaveBeenCalledTimes(1);
        const getSymbolCandlesticksParams = binanceClientMock.getSymbolCandlesticks.mock.calls[0];
        expect(getSymbolCandlesticksParams.length).toEqual(3);
        expect(getSymbolCandlesticksParams[0]).toEqual('ABCDEF');
        expect(getSymbolCandlesticksParams[1]).toEqual('1d');
        expect(getSymbolCandlesticksParams[2]).toEqual(1);
      });
    });

    describe('When Binance candlesticks are not found', () => {
      beforeEach(() => {
        binanceClientMock.getSymbolCandlesticks.mockResolvedValue([]);
      });

      it('Then empty list is returned', async () => {
        const result = await candlestickRepository.getAllBySymbol('ABC#DEF', 1, '1d');
        expect(result).toEqual([]);

        expect(binanceClientMock.getSymbolCandlesticks).toHaveBeenCalledTimes(1);
        const getSymbolCandlesticksParams = binanceClientMock.getSymbolCandlesticks.mock.calls[0];
        expect(getSymbolCandlesticksParams.length).toEqual(3);
        expect(getSymbolCandlesticksParams[0]).toEqual('ABCDEF');
        expect(getSymbolCandlesticksParams[1]).toEqual('1d');
        expect(getSymbolCandlesticksParams[2]).toEqual(1);
      });
    });
  });
});
