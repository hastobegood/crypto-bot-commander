import MockDate from 'mockdate';
import { mocked } from 'ts-jest/utils';
import { Candlestick } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildCandlesticksFromTo, buildDefaultCandlestick } from '@hastobegood/crypto-bot-artillery/test/builders';
import { GetCandlestickService } from '../../../../src/code/domain/candlestick/get-candlestick-service';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';

const candlestickRepositoryMock = mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let getCandlestickService: GetCandlestickService;
beforeEach(() => {
  candlestickRepositoryMock.save = jest.fn();
  candlestickRepositoryMock.getLastBySymbol = jest.fn();
  candlestickRepositoryMock.getAllBySymbol = jest.fn();

  getCandlestickService = new GetCandlestickService(candlestickRepositoryMock);
});

describe('GetCandlestickService', () => {
  let date: Date;
  let candlestick: Candlestick;
  let candlesticks: Candlestick[];

  beforeEach(() => {
    date = new Date();
    MockDate.set(date);
  });

  describe('Given last candlestick to retrieve', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T16:38:10.500Z');
      MockDate.set(date);
    });

    afterEach(() => {
      expect(candlestickRepositoryMock.save).toHaveBeenCalledTimes(0);
      expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(0);
    });

    describe('When last candlestick is not found', () => {
      beforeEach(() => {
        candlestickRepositoryMock.getLastBySymbol.mockResolvedValue(null);
      });

      it('Then null is returned', async () => {
        const result = await getCandlestickService.getLastBySymbol('Binance', 'ABC');
        expect(result).toBeNull();

        expect(candlestickRepositoryMock.getLastBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getLastBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('1m');
      });
    });

    describe('When last candlestick is found', () => {
      beforeEach(() => {
        candlestick = buildDefaultCandlestick();
        candlestickRepositoryMock.getLastBySymbol.mockResolvedValue(candlestick);
      });

      it('Then last candlestick is returned', async () => {
        const result = await getCandlestickService.getLastBySymbol('Binance', 'ABC');
        expect(result).toEqual(candlestick);

        expect(candlestickRepositoryMock.getLastBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getLastBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('1m');
      });
    });
  });

  describe('Given candlesticks to retrieve without starting date', () => {
    describe('When last candlestick is not found', () => {
      beforeEach(() => {
        candlestickRepositoryMock.getLastBySymbol.mockResolvedValueOnce(null);
      });

      it('Then empty list is returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1m', 10);
        expect(results.length).toEqual(0);
        expect(results).toEqual([]);

        expect(candlestickRepositoryMock.getLastBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getLastBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('1m');
      });
    });

    describe('When last candlestick is found', () => {
      beforeEach(() => {
        candlestick = buildDefaultCandlestick();
        candlestickRepositoryMock.getLastBySymbol.mockResolvedValueOnce(candlestick);

        candlesticks = [...buildCandlesticksFromTo(new Date(new Date(candlestick.openingDate - 60 * 9 * 1_000).setUTCSeconds(0, 0)), new Date(new Date(candlestick.openingDate).setUTCSeconds(0, 0)), 60)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then last symbol opening date is used to retrieve candlesticks', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1m', 10);
        expect(results.length).toEqual(10);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getLastBySymbol).toHaveBeenCalledTimes(1);
        const getLastBySymbolParams = candlestickRepositoryMock.getLastBySymbol.mock.calls[0];
        expect(getLastBySymbolParams.length).toEqual(3);
        expect(getLastBySymbolParams[0]).toEqual('Binance');
        expect(getLastBySymbolParams[1]).toEqual('ABC');
        expect(getLastBySymbolParams[2]).toEqual('1m');

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('1m');
        expect(getAllBySymbolParams[3]).toEqual(new Date(candlestick.openingDate - 60 * 9 * 1_000).setUTCSeconds(0, 0));
        expect(getAllBySymbolParams[4]).toEqual(new Date(candlestick.openingDate).setUTCSeconds(0, 0));
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 60 periods of 1 minute interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T16:38:10.500Z');
      MockDate.set(date);
    });

    describe('When there are gaps and not enough data in the last 3 days', () => {
      beforeEach(() => {
        candlesticks = [
          ...buildCandlesticksFromTo(new Date('2021-09-13T15:39:00.000Z'), new Date('2021-09-13T16:00:00.000Z'), 60),
          ...buildCandlesticksFromTo(new Date('2021-09-13T16:02:00.000Z'), new Date('2021-09-13T16:10:00.000Z'), 60),
          ...buildCandlesticksFromTo(new Date('2021-09-13T16:12:00.000Z'), new Date('2021-09-13T16:38:00.000Z'), 60),
        ];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      });

      it('Then less than 60 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1m', 60, date.valueOf());
        expect(results.length).toEqual(58);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(4);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1m', toTimestamp('2021-09-13T15:39:00.000Z'), toTimestamp('2021-09-13T16:38:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '1m', toTimestamp('2021-09-12T15:39:00.000Z'), toTimestamp('2021-09-13T15:38:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '1m', toTimestamp('2021-09-11T15:39:00.000Z'), toTimestamp('2021-09-12T15:38:00.000Z')]);
        expect(getAllBySymbolParams[3].length).toEqual(5);
        expect(getAllBySymbolParams[3]).toEqual(['Binance', 'ABC', '1m', toTimestamp('2021-09-10T15:39:00.000Z'), toTimestamp('2021-09-11T15:38:00.000Z')]);
      });
    });

    describe('When there are gaps and enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-09-11T15:39:00.000Z'), new Date('2021-09-11T23:59:00.000Z'), 60)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-09-12T23:00:00.000Z'), new Date('2021-09-12T23:00:00.000Z'), 60)];
        const candlesticks3 = [
          ...buildCandlesticksFromTo(new Date('2021-09-13T15:39:00.000Z'), new Date('2021-09-13T16:00:00.000Z'), 60),
          ...buildCandlesticksFromTo(new Date('2021-09-13T16:02:00.000Z'), new Date('2021-09-13T16:10:00.000Z'), 60),
          ...buildCandlesticksFromTo(new Date('2021-09-13T16:12:00.000Z'), new Date('2021-09-13T16:38:00.000Z'), 60),
        ];
        candlesticks = [...candlesticks1.slice(-1), ...candlesticks2, ...candlesticks3];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks3).mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce(candlesticks1);
      });

      it('Then exactly 60 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1m', 60, date.valueOf());
        expect(results.length).toEqual(60);
        expect(results).toEqual(candlesticks.slice(-60));

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(3);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1m', toTimestamp('2021-09-13T15:39:00.000Z'), toTimestamp('2021-09-13T16:38:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '1m', toTimestamp('2021-09-12T15:39:00.000Z'), toTimestamp('2021-09-13T15:38:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '1m', toTimestamp('2021-09-11T15:39:00.000Z'), toTimestamp('2021-09-12T15:38:00.000Z')]);
      });
    });

    describe('When there are no gaps', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-13T15:39:00.000Z'), new Date('2021-09-13T16:38:00.000Z'), 60)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks);
      });

      it('Then exactly 60 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1m', 60, date.valueOf());
        expect(results.length).toEqual(60);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1m', toTimestamp('2021-09-13T15:39:00.000Z'), toTimestamp('2021-09-13T16:38:00.000Z')]);
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 12 periods of 5 minutes interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T00:54:59.999Z');
      MockDate.set(date);
    });

    describe('When there are gaps and not enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-09-10T10:00:00.000Z'), new Date('2021-09-10T10:05:00.000Z'), 300)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-09-12T23:00:00.000Z'), new Date('2021-09-12T23:05:00.000Z'), 300)];
        const candlesticks3 = [...buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T00:20:00.000Z'), 300), ...buildCandlesticksFromTo(new Date('2021-09-13T00:50:00.000Z'), new Date('2021-09-13T00:55:00.000Z'), 300)];
        candlesticks = [...candlesticks1, ...candlesticks2, ...candlesticks3];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks3).mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce([]).mockResolvedValueOnce(candlesticks1);
      });

      it('Then less than 12 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '5m', 12, date.valueOf());
        expect(results.length).toEqual(11);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(4);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '5m', toTimestamp('2021-09-12T23:55:00.000Z'), toTimestamp('2021-09-13T00:50:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '5m', toTimestamp('2021-09-11T23:55:00.000Z'), toTimestamp('2021-09-12T23:50:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '5m', toTimestamp('2021-09-10T23:55:00.000Z'), toTimestamp('2021-09-11T23:50:00.000Z')]);
        expect(getAllBySymbolParams[3].length).toEqual(5);
        expect(getAllBySymbolParams[3]).toEqual(['Binance', 'ABC', '5m', toTimestamp('2021-09-09T23:55:00.000Z'), toTimestamp('2021-09-10T23:50:00.000Z')]);
      });
    });

    describe('When there are gaps and enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-09-12T23:00:00.000Z'), new Date('2021-09-12T23:45:00.000Z'), 300)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-09-12T23:50:00.000Z'), new Date('2021-09-12T23:50:00.000Z'), 300)];
        const candlesticks3 = [...buildCandlesticksFromTo(new Date('2021-09-12T23:55:00.000Z'), new Date('2021-09-13T00:45:00.000Z'), 300)];
        candlesticks = [...candlesticks2, ...candlesticks3];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks3).mockResolvedValueOnce([...candlesticks1, ...candlesticks2]);
      });

      it('Then exactly 12 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '5m', 12, date.valueOf());
        expect(results.length).toEqual(12);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(2);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '5m', toTimestamp('2021-09-12T23:55:00.000Z'), toTimestamp('2021-09-13T00:50:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '5m', toTimestamp('2021-09-11T23:55:00.000Z'), toTimestamp('2021-09-12T23:50:00.000Z')]);
      });
    });

    describe('When there are not gaps', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-12T23:55:00.000Z'), new Date('2021-09-13T00:50:00.000Z'), 300)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks);
      });

      it('Then exactly 12 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '5m', 12, date.valueOf());
        expect(results.length).toEqual(12);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '5m', toTimestamp('2021-09-12T23:55:00.000Z'), toTimestamp('2021-09-13T00:50:00.000Z')]);
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 3 periods of 15 minutes interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:01:00.000Z');
      MockDate.set(date);
    });

    describe('When there are gaps and not enough data in the last 3 days', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-13T11:35:00.000Z'), new Date('2021-09-13T12:00:00.000Z'), 900)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      });

      it('Then less than 3 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '15m', 3, date.valueOf());
        expect(results.length).toEqual(2);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(4);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '15m', toTimestamp('2021-09-13T11:30:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '15m', toTimestamp('2021-09-12T11:30:00.000Z'), toTimestamp('2021-09-13T11:15:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '15m', toTimestamp('2021-09-11T11:30:00.000Z'), toTimestamp('2021-09-12T11:15:00.000Z')]);
        expect(getAllBySymbolParams[3].length).toEqual(5);
        expect(getAllBySymbolParams[3]).toEqual(['Binance', 'ABC', '15m', toTimestamp('2021-09-10T11:30:00.000Z'), toTimestamp('2021-09-11T11:15:00.000Z')]);
      });
    });

    describe('When there are gaps and enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 900)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-09-13T11:35:00.000Z'), new Date('2021-09-13T12:00:00.000Z'), 900)];
        candlesticks = [...candlesticks1, ...candlesticks2];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce(candlesticks1);
      });

      it('Then exactly 3 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '15m', 3, date.valueOf());
        expect(results.length).toEqual(3);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(2);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '15m', toTimestamp('2021-09-13T11:30:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '15m', toTimestamp('2021-09-12T11:30:00.000Z'), toTimestamp('2021-09-13T11:15:00.000Z')]);
      });
    });

    describe('When there no are gaps', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-13T11:20:00.000Z'), new Date('2021-09-13T12:00:00.000Z'), 900)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks);
      });

      it('Then exactly 3 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '15m', 3, date.valueOf());
        expect(results.length).toEqual(3);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '15m', toTimestamp('2021-09-13T11:30:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 24 periods of 1 hour interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:00:00.000Z');
      MockDate.set(date);
    });

    describe('When there are gaps and not enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-09-10T02:00:00.000Z'), new Date('2021-09-10T03:00:00.000Z'), 3_600)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T09:00:00.000Z'), 3_600)];
        candlesticks = [...candlesticks1, ...candlesticks2];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce(candlesticks1);
      });

      it('Then less than 24 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1h', 24, date.valueOf());
        expect(results.length).toEqual(12);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(4);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1h', toTimestamp('2021-09-12T13:00:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '1h', toTimestamp('2021-09-11T13:00:00.000Z'), toTimestamp('2021-09-12T12:00:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '1h', toTimestamp('2021-09-10T13:00:00.000Z'), toTimestamp('2021-09-11T12:00:00.000Z')]);
        expect(getAllBySymbolParams[3].length).toEqual(5);
        expect(getAllBySymbolParams[3]).toEqual(['Binance', 'ABC', '1h', toTimestamp('2021-09-09T13:00:00.000Z'), toTimestamp('2021-09-10T12:00:00.000Z')]);
      });
    });

    describe('When there are gaps and enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-09-11T13:00:00.000Z'), new Date('2021-09-12T00:00:00.000Z'), 3_600)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T11:00:00.000Z'), 3_600)];
        candlesticks = [...candlesticks1, ...candlesticks2];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce([]).mockResolvedValueOnce(candlesticks1);
      });

      it('Then exactly 24 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1h', 24, date.valueOf());
        expect(results.length).toEqual(24);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(3);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1h', toTimestamp('2021-09-12T13:00:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '1h', toTimestamp('2021-09-11T13:00:00.000Z'), toTimestamp('2021-09-12T12:00:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '1h', toTimestamp('2021-09-10T13:00:00.000Z'), toTimestamp('2021-09-11T12:00:00.000Z')]);
      });
    });

    describe('When there are no gaps', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-12T12:00:00.000Z'), new Date('2021-09-13T11:00:00.000Z'), 3_600)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks);
      });

      it('Then exactly 24 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1h', 24, date.valueOf());
        expect(results.length).toEqual(24);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1h', toTimestamp('2021-09-12T13:00:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 10 period of 6 hours interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T05:01:00.500Z');
      MockDate.set(date);
    });

    describe('When there are gaps and not enough data in the last 3 days', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-13T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 21_600)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      });

      it('Then less than 10 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '6h', 10, date.valueOf());
        expect(results.length).toEqual(1);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(4);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '6h', toTimestamp('2021-09-10T18:00:00.000Z'), toTimestamp('2021-09-13T00:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '6h', toTimestamp('2021-09-09T18:00:00.000Z'), toTimestamp('2021-09-10T12:00:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '6h', toTimestamp('2021-09-08T18:00:00.000Z'), toTimestamp('2021-09-09T12:00:00.000Z')]);
        expect(getAllBySymbolParams[3].length).toEqual(5);
        expect(getAllBySymbolParams[3]).toEqual(['Binance', 'ABC', '6h', toTimestamp('2021-09-07T18:00:00.000Z'), toTimestamp('2021-09-08T12:00:00.000Z')]);
      });
    });

    describe('When there are gaps and enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-09-00T12:00:00.000Z'), new Date('2021-09-09T12:00:00.000Z'), 21_600)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-09-11T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 21_600)];
        candlesticks = [...candlesticks1, ...candlesticks2];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce([]).mockResolvedValueOnce(candlesticks1);
      });

      it('Then exactly 10 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '6h', 10, date.valueOf());
        expect(results.length).toEqual(10);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(3);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '6h', toTimestamp('2021-09-10T18:00:00.000Z'), toTimestamp('2021-09-13T00:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '6h', toTimestamp('2021-09-09T18:00:00.000Z'), toTimestamp('2021-09-10T12:00:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '6h', toTimestamp('2021-09-08T18:00:00.000Z'), toTimestamp('2021-09-09T12:00:00.000Z')]);
      });
    });

    describe('When there are no gaps', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-10T18:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 21_600)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks);
      });

      it('Then less than 10 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '6h', 10, date.valueOf());
        expect(results.length).toEqual(10);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '6h', toTimestamp('2021-09-10T18:00:00.000Z'), toTimestamp('2021-09-13T00:00:00.000Z')]);
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 5 period of 12 hours interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:00:00.000Z');
      MockDate.set(date);
    });

    describe('When there are gaps and not enough data in the last 3 days', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-11T12:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 43_200)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      });

      it('Then less than 5 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '12h', 5, date.valueOf());
        expect(results.length).toEqual(4);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(4);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '12h', toTimestamp('2021-09-11T12:00:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '12h', toTimestamp('2021-09-10T12:00:00.000Z'), toTimestamp('2021-09-11T00:00:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '12h', toTimestamp('2021-09-09T12:00:00.000Z'), toTimestamp('2021-09-10T00:00:00.000Z')]);
        expect(getAllBySymbolParams[3].length).toEqual(5);
        expect(getAllBySymbolParams[3]).toEqual(['Binance', 'ABC', '12h', toTimestamp('2021-09-08T12:00:00.000Z'), toTimestamp('2021-09-09T00:00:00.000Z')]);
      });
    });

    describe('When there are gaps and enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-09-10T12:00:00.000Z'), new Date('2021-09-10T12:00:00.000Z'), 43_200)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-09-11T12:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 43_200)];
        candlesticks = [...candlesticks1, ...candlesticks2];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce(candlesticks1);
      });

      it('Then exactly 5 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '12h', 5, date.valueOf());
        expect(results.length).toEqual(5);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(2);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '12h', toTimestamp('2021-09-11T12:00:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
      });
    });

    describe('When there are no gaps', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-09-11T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 43_200)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks);
      });

      it('Then exactly 5 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '12h', 5, date.valueOf());
        expect(results.length).toEqual(5);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '12h', toTimestamp('2021-09-11T12:00:00.000Z'), toTimestamp('2021-09-13T12:00:00.000Z')]);
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 100 periods of 1 day interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T00:00:30.000Z');
      MockDate.set(date);
    });

    describe('When there are gaps and not enough data in the last 3 days', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-06-07T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 86_400)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      });

      it('Then less than 100 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1d', 100, date.valueOf());
        expect(results.length).toEqual(99);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(4);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1d', toTimestamp('2021-06-06T00:00:00.000Z'), toTimestamp('2021-09-13T00:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '1d', toTimestamp('2021-06-05T00:00:00.000Z'), toTimestamp('2021-06-05T00:00:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '1d', toTimestamp('2021-06-04T00:00:00.000Z'), toTimestamp('2021-06-04T00:00:00.000Z')]);
        expect(getAllBySymbolParams[3].length).toEqual(5);
        expect(getAllBySymbolParams[3]).toEqual(['Binance', 'ABC', '1d', toTimestamp('2021-06-03T00:00:00.000Z'), toTimestamp('2021-06-03T00:00:00.000Z')]);
      });
    });

    describe('When there are gaps and enough data in the last 3 days', () => {
      beforeEach(() => {
        const candlesticks1 = [...buildCandlesticksFromTo(new Date('2021-06-05T00:00:00.000Z'), new Date('2021-06-05T00:00:00.000Z'), 86_400)];
        const candlesticks2 = [...buildCandlesticksFromTo(new Date('2021-06-07T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 86_400)];
        candlesticks = [...candlesticks1, ...candlesticks2];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce([]).mockResolvedValueOnce(candlesticks1);
      });

      it('Then exactly 100 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1d', 100, date.valueOf());
        expect(results.length).toEqual(100);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(3);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1d', toTimestamp('2021-06-06T00:00:00.000Z'), toTimestamp('2021-09-13T00:00:00.000Z')]);
        expect(getAllBySymbolParams[1].length).toEqual(5);
        expect(getAllBySymbolParams[1]).toEqual(['Binance', 'ABC', '1d', toTimestamp('2021-06-05T00:00:00.000Z'), toTimestamp('2021-06-05T00:00:00.000Z')]);
        expect(getAllBySymbolParams[2].length).toEqual(5);
        expect(getAllBySymbolParams[2]).toEqual(['Binance', 'ABC', '1d', toTimestamp('2021-06-04T00:00:00.000Z'), toTimestamp('2021-06-04T00:00:00.000Z')]);
      });
    });

    describe('When there are no gaps', () => {
      beforeEach(() => {
        candlesticks = [...buildCandlesticksFromTo(new Date('2021-06-06T00:00:00.000Z'), new Date('2021-09-13T00:00:00.000Z'), 86_400)];
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValueOnce(candlesticks).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      });

      it('Then exactly 100 candlesticks are returned ', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1d', 100, date.valueOf());
        expect(results.length).toEqual(100);
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0].length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual(['Binance', 'ABC', '1d', toTimestamp('2021-06-06T00:00:00.000Z'), toTimestamp('2021-09-13T00:00:00.000Z')]);
      });
    });
  });
});

const toTimestamp = (date: string): number => new Date(date).valueOf();
