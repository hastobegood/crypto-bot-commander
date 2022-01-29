import { mocked } from 'ts-jest/utils';
import { Candlesticks, FetchCandlestickClient } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildDefaultCandlesticks } from '@hastobegood/crypto-bot-artillery/test/builders';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { InitializeCandlestickService } from '../../../../src/code/domain/candlestick/initialize-candlestick-service';

const fetchCandlestickClientMock = mocked(jest.genMockFromModule<FetchCandlestickClient>('@hastobegood/crypto-bot-artillery'), true);
const candlestickRepositoryMock = mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let initializeCandlestickService: InitializeCandlestickService;
beforeEach(() => {
  fetchCandlestickClientMock.fetchAll = jest.fn();
  candlestickRepositoryMock.save = jest.fn();
  candlestickRepositoryMock.getLastBySymbol = jest.fn();
  candlestickRepositoryMock.getAllBySymbol = jest.fn();

  initializeCandlestickService = new InitializeCandlestickService(fetchCandlestickClientMock, candlestickRepositoryMock);
});

describe('InitCandlestickService', () => {
  afterEach(() => {
    expect(candlestickRepositoryMock.getLastBySymbol).toHaveBeenCalledTimes(0);
    expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(0);
  });

  describe('Given a symbol candlesticks to initialize for a specific year and month', () => {
    describe('When symbol candlesticks are retrieved', () => {
      let candlesticks1: Candlesticks;
      let candlesticks2: Candlesticks;
      let candlesticks3: Candlesticks;
      let candlesticks4: Candlesticks;

      beforeEach(() => {
        candlesticks1 = buildDefaultCandlesticks();
        candlesticks2 = buildDefaultCandlesticks();
        candlesticks3 = buildDefaultCandlesticks();
        candlesticks4 = buildDefaultCandlesticks();
        candlesticks4.values = [];
        fetchCandlestickClientMock.fetchAll.mockResolvedValueOnce(candlesticks1).mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce(candlesticks3).mockResolvedValue(candlesticks4);
      });

      it('Then symbol candlesticks are saved with intervals 1m, 1h and 1d', async () => {
        await initializeCandlestickService.initializeAllBySymbol('Binance', 'ABC', 2021, 9);

        expect(fetchCandlestickClientMock.fetchAll).toHaveBeenCalledTimes(46);
        const fetchAllParams = fetchCandlestickClientMock.fetchAll.mock.calls;
        expect(fetchAllParams[0]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-01T00:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-01T16:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[1]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-01T16:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-02T09:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[2]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-02T09:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-03T01:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[3]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-03T02:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-03T18:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[4]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-03T18:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-04T11:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[5]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-04T11:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-05T03:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[6]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-05T04:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-05T20:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[7]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-05T20:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-06T13:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[8]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-06T13:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-07T05:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[9]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-07T06:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-07T22:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[10]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-07T22:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-08T15:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[11]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-08T15:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-09T07:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[12]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-09T08:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-10T00:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[13]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-10T00:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-10T17:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[14]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-10T17:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-11T09:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[15]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-11T10:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-12T02:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[16]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-12T02:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-12T19:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[17]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-12T19:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-13T11:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[18]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-13T12:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-14T04:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[19]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-14T04:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-14T21:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[20]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-14T21:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-15T13:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[21]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-15T14:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-16T06:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[22]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-16T06:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-16T23:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[23]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-16T23:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-17T15:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[24]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-17T16:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-18T08:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[25]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-18T08:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-19T01:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[26]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-19T01:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-19T17:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[27]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-19T18:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-20T10:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[28]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-20T10:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-21T03:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[29]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-21T03:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-21T19:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[30]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-21T20:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-22T12:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[31]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-22T12:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-23T05:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[32]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-23T05:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-23T21:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[33]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-23T22:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-24T14:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[34]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-24T14:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-25T07:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[35]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-25T07:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-25T23:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[36]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-26T00:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-26T16:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[37]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-26T16:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-27T09:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[38]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-27T09:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-28T01:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[39]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-28T02:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-28T18:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[40]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-28T18:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-29T11:19:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[41]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-29T11:20:00.000Z').valueOf(),
            endDate: new Date('2021-09-30T03:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[42]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-30T04:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-30T20:39:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[43]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1m',
            period: 1_000,
            startDate: new Date('2021-09-30T20:40:00.000Z').valueOf(),
            endDate: new Date('2021-09-30T23:59:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[44]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1h',
            period: 1_000,
            startDate: new Date('2021-09-01T00:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-30T23:00:00.000Z').valueOf(),
          },
        ]);
        expect(fetchAllParams[45]).toEqual([
          {
            exchange: 'Binance',
            symbol: 'ABC',
            interval: '1d',
            period: 1_000,
            startDate: new Date('2021-09-01T00:00:00.000Z').valueOf(),
            endDate: new Date('2021-09-30T00:00:00.000Z').valueOf(),
          },
        ]);

        expect(candlestickRepositoryMock.save).toHaveBeenCalledTimes(3);
        const saveParams = candlestickRepositoryMock.save.mock.calls;
        expect(saveParams[0]).toEqual([candlesticks1]);
        expect(saveParams[1]).toEqual([candlesticks2]);
        expect(saveParams[2]).toEqual([candlesticks3]);
      });
    });
  });
});
