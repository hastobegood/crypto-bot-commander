import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { HttpPriceRepository } from '../../../../src/code/infrastructure/price/http-price-repository';
import { BinanceSymbolPrice } from '../../../../src/code/infrastructure/binance/model/binance-price';
import { buildDefaultBinanceSymbolPrice } from '../../../builders/infrastructure/binance/binance-symbol-price-test-builder';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let priceRepository: HttpPriceRepository;
beforeEach(() => {
  binanceClientMock.getSymbolAveragePrice = jest.fn();
  binanceClientMock.getSymbolCurrentPrice = jest.fn();
  priceRepository = new HttpPriceRepository(binanceClientMock);
});

describe('HttpPriceRepository', () => {
  describe('Given a Binance symbol price to retrieve', () => {
    let binanceSymbolAveragePrice: BinanceSymbolPrice;
    let binanceSymbolCurrentPrice: BinanceSymbolPrice;

    beforeEach(() => {
      binanceSymbolCurrentPrice = buildDefaultBinanceSymbolPrice();
      binanceSymbolAveragePrice = buildDefaultBinanceSymbolPrice();
    });

    describe('When symbol price retrieval has succeeded', () => {
      beforeEach(() => {
        binanceClientMock.getSymbolAveragePrice.mockResolvedValue(binanceSymbolAveragePrice);
        binanceClientMock.getSymbolCurrentPrice.mockResolvedValue(binanceSymbolCurrentPrice);
      });

      it('Then symbol price is returned with average and current prices', async () => {
        const result = await priceRepository.getBySymbol('ABC');
        expect(result).toBeDefined();
        expect(result.symbol).toEqual('ABC');
        expect(result.averagePrice).toEqual(+binanceSymbolAveragePrice.price);
        expect(result.currentPrice).toEqual(+binanceSymbolCurrentPrice.price);

        expect(binanceClientMock.getSymbolAveragePrice).toHaveBeenCalledTimes(1);
        const getSymbolAveragePriceParams = binanceClientMock.getSymbolAveragePrice.mock.calls[0];
        expect(getSymbolAveragePriceParams).toBeDefined();
        expect(getSymbolAveragePriceParams[0]).toEqual('ABC');

        expect(binanceClientMock.getSymbolCurrentPrice).toHaveBeenCalledTimes(1);
        const getSymbolCurrentPriceParams = binanceClientMock.getSymbolCurrentPrice.mock.calls[0];
        expect(getSymbolCurrentPriceParams).toBeDefined();
        expect(getSymbolCurrentPriceParams[0]).toEqual('ABC');
      });
    });
  });
});
