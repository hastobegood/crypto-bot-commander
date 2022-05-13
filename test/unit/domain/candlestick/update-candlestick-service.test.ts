import { Candlesticks, FetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildDefaultCandlesticks } from '@hastobegood/crypto-bot-artillery/test/builders';
import MockDate from 'mockdate';

import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { UpdateCandlestickService } from '../../../../src/code/domain/candlestick/update-candlestick-service';

const fetchCandlestickClientMock = jest.mocked(jest.genMockFromModule<FetchCandlestickClient>('@hastobegood/crypto-bot-artillery'), true);
const candlestickRepositoryMock = jest.mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let updateCandlestickService: UpdateCandlestickService;
beforeEach(() => {
  fetchCandlestickClientMock.fetchAll = jest.fn();
  candlestickRepositoryMock.save = jest.fn();
  candlestickRepositoryMock.getLastBySymbol = jest.fn();
  candlestickRepositoryMock.getAllBySymbol = jest.fn();

  updateCandlestickService = new UpdateCandlestickService(fetchCandlestickClientMock, candlestickRepositoryMock);
});

describe('UpdateCandlestickService', () => {
  let date: Date;

  beforeEach(() => {
    date = new Date('2021-09-17T00:00:11.666Z');
    MockDate.set(date);
  });

  afterEach(() => {
    expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(0);
  });

  describe('Given a symbol candlesticks to update', () => {
    let candlesticks1m: Candlesticks;
    let candlesticks1h: Candlesticks;
    let candlesticks1d: Candlesticks;

    describe('When candlesticks are not found', () => {
      beforeEach(() => {
        candlesticks1m = buildDefaultCandlesticks();
        candlesticks1m.values = [];
        candlesticks1h = buildDefaultCandlesticks();
        candlesticks1h.values = [];
        candlesticks1d = buildDefaultCandlesticks();
        candlesticks1d.values = [];
        fetchCandlestickClientMock.fetchAll.mockResolvedValueOnce(candlesticks1m).mockResolvedValueOnce(candlesticks1h).mockResolvedValueOnce(candlesticks1d);
      });

      it('Then candlesticks are not saved', async () => {
        await updateCandlestickService.updateAllBySymbol('Binance', 'ABC');

        expect(fetchCandlestickClientMock.fetchAll).toHaveBeenCalledTimes(3);
        let getAllBySymbolParams = fetchCandlestickClientMock.fetchAll.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(1);
        expect(getAllBySymbolParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1m',
          period: 2,
        });
        getAllBySymbolParams = fetchCandlestickClientMock.fetchAll.mock.calls[1];
        expect(getAllBySymbolParams.length).toEqual(1);
        expect(getAllBySymbolParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1h',
          period: 2,
        });
        getAllBySymbolParams = fetchCandlestickClientMock.fetchAll.mock.calls[2];
        expect(getAllBySymbolParams.length).toEqual(1);
        expect(getAllBySymbolParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1d',
          period: 2,
        });

        expect(candlestickRepositoryMock.save).toHaveBeenCalledTimes(0);
      });
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks1m = buildDefaultCandlesticks();
        candlesticks1h = buildDefaultCandlesticks();
        candlesticks1d = buildDefaultCandlesticks();
        fetchCandlestickClientMock.fetchAll.mockResolvedValueOnce(candlesticks1m).mockResolvedValueOnce(candlesticks1h).mockResolvedValueOnce(candlesticks1d);
      });

      it('Then candlesticks are saved', async () => {
        await updateCandlestickService.updateAllBySymbol('Binance', 'ABC');

        expect(fetchCandlestickClientMock.fetchAll).toHaveBeenCalledTimes(3);
        let getAllBySymbolParams = fetchCandlestickClientMock.fetchAll.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(1);
        expect(getAllBySymbolParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1m',
          period: 2,
        });
        getAllBySymbolParams = fetchCandlestickClientMock.fetchAll.mock.calls[1];
        expect(getAllBySymbolParams.length).toEqual(1);
        expect(getAllBySymbolParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1h',
          period: 2,
        });
        getAllBySymbolParams = fetchCandlestickClientMock.fetchAll.mock.calls[2];
        expect(getAllBySymbolParams.length).toEqual(1);
        expect(getAllBySymbolParams[0]).toEqual({
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1d',
          period: 2,
        });

        expect(candlestickRepositoryMock.save).toHaveBeenCalledTimes(3);
        let saveParams = candlestickRepositoryMock.save.mock.calls[0];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual(candlesticks1m);
        saveParams = candlestickRepositoryMock.save.mock.calls[1];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual(candlesticks1h);
        saveParams = candlestickRepositoryMock.save.mock.calls[2];
        expect(saveParams.length).toEqual(1);
        expect(saveParams[0]).toEqual(candlesticks1d);
      });
    });
  });
});
