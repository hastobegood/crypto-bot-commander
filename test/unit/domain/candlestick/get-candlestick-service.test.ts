import { mocked } from 'ts-jest/utils';
import { GetCandlestickService } from '../../../../src/code/domain/candlestick/get-candlestick-service';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { Candlestick } from '../../../../src/code/domain/candlestick/model/candlestick';
import { buildCandlesticksFromTo } from '../../../builders/domain/candlestick/candlestick-test-builder';
import MockDate from 'mockdate';

const candlestickRepositoryMock = mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let getCandlestickService: GetCandlestickService;
beforeEach(() => {
  candlestickRepositoryMock.getAllBySymbol = jest.fn();

  getCandlestickService = new GetCandlestickService(candlestickRepositoryMock);
});

describe('GetCandlestickService', () => {
  let date: Date;
  let candlesticks: Candlestick[];

  beforeEach(() => {
    date = new Date();
    MockDate.set(date);
  });

  describe('Given candlesticks to retrieve for the last 60 periods of 1 minute interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T16:38:10.500Z');
      MockDate.set(date);
    });

    describe('When data is missing', () => {
      beforeEach(() => {
        candlesticks = [
          ...buildCandlesticksFromTo(new Date('2021-09-13T15:40:00.000Z'), new Date('2021-09-13T16:00:00.000Z')),
          ...buildCandlesticksFromTo(new Date('2021-09-13T16:02:00.000Z'), new Date('2021-09-13T16:10:00.000Z')),
          ...buildCandlesticksFromTo(new Date('2021-09-13T16:12:00.000Z'), new Date('2021-09-13T16:38:00.000Z')),
        ];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 1 minute interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 60, '1m');
        expect(results.length).toEqual(57);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T15:39:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T16:38:00.000Z').valueOf());
      });
    });

    describe('When data is not missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-13T15:39:00.000Z'), new Date('2021-09-13T16:38:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 1 minute interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 60, '1m');
        expect(results.length).toEqual(60);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T15:39:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T16:38:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 12 periods of 5 minutes interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T00:54:59.999Z');
      MockDate.set(date);
    });

    describe('When data is missing', () => {
      beforeEach(() => {
        candlesticks = [
          ...buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T00:07:00.000Z')),
          ...buildCandlesticksFromTo(new Date('2021-09-13T00:09:00.000Z'), new Date('2021-09-13T00:44:00.000Z')),
          ...buildCandlesticksFromTo(new Date('2021-09-13T00:50:00.000Z'), new Date('2021-09-13T00:54:00.000Z')),
        ];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 5 minutes interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 12, '5m');
        expect(results.length).toEqual(10);
        expect(results).toEqual([
          groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-13T00:05:00.000Z', 0, 4),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:05:00.000Z', '2021-09-13T00:10:00.000Z', 5, 8),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:10:00.000Z', '2021-09-13T00:15:00.000Z', 9, 13),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:15:00.000Z', '2021-09-13T00:20:00.000Z', 14, 18),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:20:00.000Z', '2021-09-13T00:25:00.000Z', 19, 23),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:25:00.000Z', '2021-09-13T00:30:00.000Z', 24, 28),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:30:00.000Z', '2021-09-13T00:35:00.000Z', 29, 33),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:35:00.000Z', '2021-09-13T00:40:00.000Z', 34, 38),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:40:00.000Z', '2021-09-13T00:45:00.000Z', 39, 43),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:50:00.000Z', '2021-09-13T00:55:00.000Z', 44, 48),
        ]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-12T23:55:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T00:54:00.000Z').valueOf());
      });
    });

    describe('When data is not missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-12T23:55:00.000Z'), new Date('2021-09-13T00:54:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 5 minutes interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 12, '5m');
        expect(results.length).toEqual(12);
        expect(results).toEqual([
          groupCandlesticksBy(candlesticks, '2021-09-12T23:55:00.000Z', '2021-09-13T00:00:00.000Z', 0, 4),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-13T00:05:00.000Z', 5, 9),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:05:00.000Z', '2021-09-13T00:10:00.000Z', 10, 14),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:10:00.000Z', '2021-09-13T00:15:00.000Z', 15, 19),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:15:00.000Z', '2021-09-13T00:20:00.000Z', 20, 24),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:20:00.000Z', '2021-09-13T00:25:00.000Z', 25, 29),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:25:00.000Z', '2021-09-13T00:30:00.000Z', 30, 34),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:30:00.000Z', '2021-09-13T00:35:00.000Z', 35, 39),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:35:00.000Z', '2021-09-13T00:40:00.000Z', 40, 44),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:40:00.000Z', '2021-09-13T00:45:00.000Z', 45, 49),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:45:00.000Z', '2021-09-13T00:50:00.000Z', 50, 54),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:50:00.000Z', '2021-09-13T00:55:00.000Z', 55, 59),
        ]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-12T23:55:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T00:54:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 3 periods of 15 minutes interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:01:00.000Z');
      MockDate.set(date);
    });

    describe('When data is missing', () => {
      beforeEach(() => {
        candlesticks = [
          ...buildCandlesticksFromTo(new Date('2021-09-13T11:30:00.000Z'), new Date('2021-09-13T11:35:00.000Z')),
          ...buildCandlesticksFromTo(new Date('2021-09-13T11:37:00.000Z'), new Date('2021-09-13T11:38:00.000Z')),
          ...buildCandlesticksFromTo(new Date('2021-09-13T11:40:00.000Z'), new Date('2021-09-13T12:01:00.000Z')),
        ];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 15 minutes interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 3, '15m');
        expect(results.length).toEqual(3);
        expect(results).toEqual([
          groupCandlesticksBy(candlesticks, '2021-09-13T11:30:00.000Z', '2021-09-13T11:45:00.000Z', 0, 12),
          groupCandlesticksBy(candlesticks, '2021-09-13T11:45:00.000Z', '2021-09-13T12:00:00.000Z', 13, 27),
          groupCandlesticksBy(candlesticks, '2021-09-13T12:00:00.000Z', '2021-09-13T12:15:00.000Z', 28, 29),
        ]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T11:30:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T12:01:00.000Z').valueOf());
      });
    });

    describe('When data is not missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-13T11:30:00.000Z'), new Date('2021-09-13T12:01:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 15 minutes interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 3, '15m');
        expect(results.length).toEqual(3);
        expect(results).toEqual([
          groupCandlesticksBy(candlesticks, '2021-09-13T11:30:00.000Z', '2021-09-13T11:45:00.000Z', 0, 14),
          groupCandlesticksBy(candlesticks, '2021-09-13T11:45:00.000Z', '2021-09-13T12:00:00.000Z', 15, 29),
          groupCandlesticksBy(candlesticks, '2021-09-13T12:00:00.000Z', '2021-09-13T12:15:00.000Z', 30, 31),
        ]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T11:30:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T12:01:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 24 periods of 1 hour interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:00:00.000Z');
      MockDate.set(date);
    });

    describe('When data is missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-12T13:00:00.000Z'), new Date('2021-09-13T09:59:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 1 hour interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 24, '1h');
        expect(results.length).toEqual(21);
        expect(results).toEqual([
          groupCandlesticksBy(candlesticks, '2021-09-12T13:00:00.000Z', '2021-09-12T14:00:00.000Z', 0, 59),
          groupCandlesticksBy(candlesticks, '2021-09-12T14:00:00.000Z', '2021-09-12T15:00:00.000Z', 60, 119),
          groupCandlesticksBy(candlesticks, '2021-09-12T15:00:00.000Z', '2021-09-12T16:00:00.000Z', 120, 179),
          groupCandlesticksBy(candlesticks, '2021-09-12T16:00:00.000Z', '2021-09-12T17:00:00.000Z', 180, 239),
          groupCandlesticksBy(candlesticks, '2021-09-12T17:00:00.000Z', '2021-09-12T18:00:00.000Z', 240, 299),
          groupCandlesticksBy(candlesticks, '2021-09-12T18:00:00.000Z', '2021-09-12T19:00:00.000Z', 300, 359),
          groupCandlesticksBy(candlesticks, '2021-09-12T19:00:00.000Z', '2021-09-12T20:00:00.000Z', 360, 419),
          groupCandlesticksBy(candlesticks, '2021-09-12T20:00:00.000Z', '2021-09-12T21:00:00.000Z', 420, 479),
          groupCandlesticksBy(candlesticks, '2021-09-12T21:00:00.000Z', '2021-09-12T22:00:00.000Z', 480, 539),
          groupCandlesticksBy(candlesticks, '2021-09-12T22:00:00.000Z', '2021-09-12T23:00:00.000Z', 540, 599),
          groupCandlesticksBy(candlesticks, '2021-09-12T23:00:00.000Z', '2021-09-13T00:00:00.000Z', 600, 659),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-13T01:00:00.000Z', 660, 719),
          groupCandlesticksBy(candlesticks, '2021-09-13T01:00:00.000Z', '2021-09-13T02:00:00.000Z', 720, 779),
          groupCandlesticksBy(candlesticks, '2021-09-13T02:00:00.000Z', '2021-09-13T03:00:00.000Z', 780, 839),
          groupCandlesticksBy(candlesticks, '2021-09-13T03:00:00.000Z', '2021-09-13T04:00:00.000Z', 840, 899),
          groupCandlesticksBy(candlesticks, '2021-09-13T04:00:00.000Z', '2021-09-13T05:00:00.000Z', 900, 959),
          groupCandlesticksBy(candlesticks, '2021-09-13T05:00:00.000Z', '2021-09-13T06:00:00.000Z', 960, 1019),
          groupCandlesticksBy(candlesticks, '2021-09-13T06:00:00.000Z', '2021-09-13T07:00:00.000Z', 1020, 1079),
          groupCandlesticksBy(candlesticks, '2021-09-13T07:00:00.000Z', '2021-09-13T08:00:00.000Z', 1080, 1139),
          groupCandlesticksBy(candlesticks, '2021-09-13T08:00:00.000Z', '2021-09-13T09:00:00.000Z', 1140, 1199),
          groupCandlesticksBy(candlesticks, '2021-09-13T09:00:00.000Z', '2021-09-13T10:00:00.000Z', 1200, 1259),
        ]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-12T13:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T12:00:00.000Z').valueOf());
      });
    });

    describe('When data is not missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-12T13:00:00.000Z'), new Date('2021-09-13T12:00:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 1 hour interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 24, '1h');
        expect(results.length).toEqual(24);
        expect(results).toEqual([
          groupCandlesticksBy(candlesticks, '2021-09-12T13:00:00.000Z', '2021-09-12T14:00:00.000Z', 0, 59),
          groupCandlesticksBy(candlesticks, '2021-09-12T14:00:00.000Z', '2021-09-12T15:00:00.000Z', 60, 119),
          groupCandlesticksBy(candlesticks, '2021-09-12T15:00:00.000Z', '2021-09-12T16:00:00.000Z', 120, 179),
          groupCandlesticksBy(candlesticks, '2021-09-12T16:00:00.000Z', '2021-09-12T17:00:00.000Z', 180, 239),
          groupCandlesticksBy(candlesticks, '2021-09-12T17:00:00.000Z', '2021-09-12T18:00:00.000Z', 240, 299),
          groupCandlesticksBy(candlesticks, '2021-09-12T18:00:00.000Z', '2021-09-12T19:00:00.000Z', 300, 359),
          groupCandlesticksBy(candlesticks, '2021-09-12T19:00:00.000Z', '2021-09-12T20:00:00.000Z', 360, 419),
          groupCandlesticksBy(candlesticks, '2021-09-12T20:00:00.000Z', '2021-09-12T21:00:00.000Z', 420, 479),
          groupCandlesticksBy(candlesticks, '2021-09-12T21:00:00.000Z', '2021-09-12T22:00:00.000Z', 480, 539),
          groupCandlesticksBy(candlesticks, '2021-09-12T22:00:00.000Z', '2021-09-12T23:00:00.000Z', 540, 599),
          groupCandlesticksBy(candlesticks, '2021-09-12T23:00:00.000Z', '2021-09-13T00:00:00.000Z', 600, 659),
          groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-13T01:00:00.000Z', 660, 719),
          groupCandlesticksBy(candlesticks, '2021-09-13T01:00:00.000Z', '2021-09-13T02:00:00.000Z', 720, 779),
          groupCandlesticksBy(candlesticks, '2021-09-13T02:00:00.000Z', '2021-09-13T03:00:00.000Z', 780, 839),
          groupCandlesticksBy(candlesticks, '2021-09-13T03:00:00.000Z', '2021-09-13T04:00:00.000Z', 840, 899),
          groupCandlesticksBy(candlesticks, '2021-09-13T04:00:00.000Z', '2021-09-13T05:00:00.000Z', 900, 959),
          groupCandlesticksBy(candlesticks, '2021-09-13T05:00:00.000Z', '2021-09-13T06:00:00.000Z', 960, 1019),
          groupCandlesticksBy(candlesticks, '2021-09-13T06:00:00.000Z', '2021-09-13T07:00:00.000Z', 1020, 1079),
          groupCandlesticksBy(candlesticks, '2021-09-13T07:00:00.000Z', '2021-09-13T08:00:00.000Z', 1080, 1139),
          groupCandlesticksBy(candlesticks, '2021-09-13T08:00:00.000Z', '2021-09-13T09:00:00.000Z', 1140, 1199),
          groupCandlesticksBy(candlesticks, '2021-09-13T09:00:00.000Z', '2021-09-13T10:00:00.000Z', 1200, 1259),
          groupCandlesticksBy(candlesticks, '2021-09-13T10:00:00.000Z', '2021-09-13T11:00:00.000Z', 1260, 1319),
          groupCandlesticksBy(candlesticks, '2021-09-13T11:00:00.000Z', '2021-09-13T12:00:00.000Z', 1320, 1379),
          groupCandlesticksBy(candlesticks, '2021-09-13T12:00:00.000Z', '2021-09-13T13:00:00.000Z', 1380, 1380),
        ]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-12T13:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T12:00:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 1 period of 6 hours interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T05:01:00.500Z');
      MockDate.set(date);
    });

    describe('When data is missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-13T00:01:00.000Z'), new Date('2021-09-13T05:01:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 6 hours interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 1, '6h');
        expect(results.length).toEqual(1);
        expect(results).toEqual([groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-13T06:00:00.000Z', 0, 300)]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T05:01:00.000Z').valueOf());
      });
    });

    describe('When data is not missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T05:01:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 6 hours interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 1, '6h');
        expect(results.length).toEqual(1);
        expect(results).toEqual([groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-13T06:00:00.000Z', 0, 301)]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T05:01:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 1 period of 12 hours interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:00:00.000Z');
      MockDate.set(date);
    });

    describe('When data is missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-13T12:00:00.000Z'), new Date('2021-09-13T12:00:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 12 hours interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 1, '12h');
        expect(results.length).toEqual(1);
        expect(results).toEqual([groupCandlesticksBy(candlesticks, '2021-09-13T12:00:00.000Z', '2021-09-14T00:00:00.000Z', 0, 0)]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T12:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T12:00:00.000Z').valueOf());
      });
    });

    describe('When data is not missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-13T12:00:00.000Z'), new Date('2021-09-13T12:01:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 12 hours interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 1, '12h');
        expect(results.length).toEqual(1);
        expect(results).toEqual([groupCandlesticksBy(candlesticks, '2021-09-13T12:00:00.000Z', '2021-09-14T00:00:00.000Z', 0, 1)]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T12:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T12:00:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 1 period of 1 day interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T00:00:30.000Z');
      MockDate.set(date);
    });

    describe('When data is missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 1 day interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 1, '1d');
        expect(results.length).toEqual(1);
        expect(results).toEqual([groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-14T00:00:00.000Z', 0, 0)]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
      });
    });

    describe('When data is not missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T00:02:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 1 day interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 1, '1d');
        expect(results.length).toEqual(1);
        expect(results).toEqual([groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-14T00:00:00.000Z', 0, 2)]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 2 periods of 1 day interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T00:00:30.000Z');
      MockDate.set(date);
    });

    describe('When data is missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-12T00:01:00.000Z'), new Date('2021-09-13T00:00:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 1 day interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 2, '1d');
        expect(results.length).toEqual(2);
        expect(results).toEqual([groupCandlesticksBy(candlesticks, '2021-09-12T00:00:00.000Z', '2021-09-13T00:00:00.000Z', 0, 1438), groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-14T00:00:00.000Z', 1439, 1439)]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-12T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
      });
    });

    describe('When data is not missing', () => {
      beforeEach(() => {
        candlesticks = buildCandlesticksFromTo(new Date('2021-09-12T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'));
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned by 1 day interval', async () => {
        const results = await getCandlestickService.getAllBySymbol('ABC', 2, '1d');
        expect(results.length).toEqual(2);
        expect(results).toEqual([groupCandlesticksBy(candlesticks, '2021-09-12T00:00:00.000Z', '2021-09-13T00:00:00.000Z', 0, 1439), groupCandlesticksBy(candlesticks, '2021-09-13T00:00:00.000Z', '2021-09-14T00:00:00.000Z', 1440, 1440)]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-12T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
      });
    });
  });
});

const groupCandlesticksBy = (candlesticks: Candlestick[], startDate: string, endDate: string, startIndex: number, endIndex: number): Candlestick => {
  return {
    openingDate: new Date(startDate).valueOf(),
    closingDate: new Date(endDate).valueOf(),
    openingPrice: candlesticks[startIndex].openingPrice,
    closingPrice: candlesticks[endIndex].closingPrice,
    lowestPrice: candlesticks.slice(startIndex, endIndex + 1).reduce((previous, current) => (current.lowestPrice < previous.lowestPrice ? current : previous)).lowestPrice,
    highestPrice: candlesticks.slice(startIndex, endIndex + 1).reduce((previous, current) => (current.highestPrice > previous.highestPrice ? current : previous)).highestPrice,
  };
};
