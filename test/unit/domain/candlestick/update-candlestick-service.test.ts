import MockDate from 'mockdate';
import { mocked } from 'ts-jest/utils';
import { Candlesticks, FetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildDefaultCandlesticks } from '@hastobegood/crypto-bot-artillery/test/builders';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { UpdateCandlestickService } from '../../../../src/code/domain/candlestick/update-candlestick-service';

const fetchCandlestickClientMock = mocked(jest.genMockFromModule<FetchCandlestickClient>('@hastobegood/crypto-bot-artillery'), true);
const candlestickRepositoryMock = mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let updateCandlestickService: UpdateCandlestickService;
beforeEach(() => {
  fetchCandlestickClientMock.fetchAll = jest.fn();
  candlestickRepositoryMock.saveAllBySymbol = jest.fn();

  updateCandlestickService = new UpdateCandlestickService(fetchCandlestickClientMock, candlestickRepositoryMock);
});

describe('UpdateCandlestickService', () => {
  let date: Date;

  beforeEach(() => {
    date = new Date('2021-09-17T00:00:11.666Z');
    MockDate.set(date);
  });

  describe('Given a symbol candlesticks to update', () => {
    let candlesticks: Candlesticks;

    describe('When candlesticks are not found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks();
        candlesticks.values = [];
        fetchCandlestickClientMock.fetchAll.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are not saved', async () => {
        await updateCandlestickService.updateAllBySymbol('Binance', 'ABC');

        expect(fetchCandlestickClientMock.fetchAll).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = fetchCandlestickClientMock.fetchAll.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(1);
        expect(getAllBySymbolParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1m',
          period: 2,
        });

        expect(candlestickRepositoryMock.saveAllBySymbol).toHaveBeenCalledTimes(0);
      });
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks();
        fetchCandlestickClientMock.fetchAll.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are saved', async () => {
        await updateCandlestickService.updateAllBySymbol('Binance', 'ABC');

        expect(fetchCandlestickClientMock.fetchAll).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = fetchCandlestickClientMock.fetchAll.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(1);
        expect(getAllBySymbolParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1m',
          period: 2,
        });

        expect(candlestickRepositoryMock.saveAllBySymbol).toHaveBeenCalledTimes(1);
        const saveAllBySymbolParams = candlestickRepositoryMock.saveAllBySymbol.mock.calls[0];
        expect(saveAllBySymbolParams.length).toEqual(3);
        expect(saveAllBySymbolParams[0]).toEqual('Binance');
        expect(saveAllBySymbolParams[1]).toEqual('ABC');
        expect(saveAllBySymbolParams[2]).toEqual(candlesticks.values);
      });
    });
  });
});
