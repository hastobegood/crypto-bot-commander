import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { HttpTickerRepository } from '../../../../src/code/infrastructure/ticker/http-ticker-repository';
import { BinanceExchange, BinanceExchangeFilter } from '../../../../src/code/infrastructure/binance/model/binance-exchange';
import { buildBinanceExchangeLotSizeFilter, buildBinanceExchangePriceFilter, buildDefaultBinanceExchange } from '../../../builders/infrastructure/binance/binance-exchange-test-builder';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let tickerRepository: HttpTickerRepository;
beforeEach(() => {
  binanceClientMock.getExchange = jest.fn();

  tickerRepository = new HttpTickerRepository(binanceClientMock);
});

describe('HttpTickerRepository', () => {
  let binanceExchange: BinanceExchange;
  let binanceExchangeLotSizeFilter: BinanceExchangeFilter;
  let binanceExchangePriceFilter: BinanceExchangeFilter;

  beforeEach(() => {
    binanceExchangeLotSizeFilter = buildBinanceExchangeLotSizeFilter('0.000001');
    binanceExchangePriceFilter = buildBinanceExchangePriceFilter('0.1');
    binanceExchange = buildDefaultBinanceExchange();
    binanceExchange.symbols[0].filters = [binanceExchangeLotSizeFilter, binanceExchangePriceFilter];
  });

  describe('Given a ticker to retrieve', () => {
    describe('When Binance ticker is found', () => {
      beforeEach(() => {
        binanceClientMock.getExchange.mockResolvedValue(binanceExchange);
      });

      it('Then ticker is returned', async () => {
        const result = await tickerRepository.getBySymbol('ABC#EDF');
        expect(result).toEqual({
          symbol: 'ABC#EDF',
          baseAssetPrecision: binanceExchange.symbols[0].baseAssetPrecision,
          quoteAssetPrecision: binanceExchange.symbols[0].quoteAssetPrecision,
          quantityPrecision: 6,
          pricePrecision: 1,
        });

        expect(binanceClientMock.getExchange).toHaveBeenCalledTimes(1);
        const getExchangeParams = binanceClientMock.getExchange.mock.calls[0];
        expect(getExchangeParams.length).toEqual(1);
        expect(getExchangeParams[0]).toEqual('ABCEDF');
      });
    });
  });
});
