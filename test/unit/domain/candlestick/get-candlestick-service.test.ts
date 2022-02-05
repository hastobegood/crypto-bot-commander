import MockDate from 'mockdate';
import { mocked } from 'ts-jest/utils';
import { Candlestick } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildCandlesticksFromTo, buildDefaultCandlestick, buildDefaultCandlesticks } from '@hastobegood/crypto-bot-artillery/test/builders';
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

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks().values;
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1m', 60, date.valueOf());
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('1m');
        expect(getAllBySymbolParams[3]).toEqual(new Date('2021-09-13T15:39:00.000Z').valueOf());
        expect(getAllBySymbolParams[4]).toEqual(new Date('2021-09-13T16:38:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 12 periods of 5 minutes interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T00:54:59.999Z');
      MockDate.set(date);
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks().values;
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '5m', 12, date.valueOf());
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('5m');
        expect(getAllBySymbolParams[3]).toEqual(new Date('2021-09-12T23:55:00.000Z').valueOf());
        expect(getAllBySymbolParams[4]).toEqual(new Date('2021-09-13T00:54:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 3 periods of 15 minutes interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:01:00.000Z');
      MockDate.set(date);
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks().values;
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '15m', 3, date.valueOf());
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('15m');
        expect(getAllBySymbolParams[3]).toEqual(new Date('2021-09-13T11:30:00.000Z').valueOf());
        expect(getAllBySymbolParams[4]).toEqual(new Date('2021-09-13T12:01:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 24 periods of 1 hour interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:00:00.000Z');
      MockDate.set(date);
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks().values;
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1h', 24, date.valueOf());
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('1h');
        expect(getAllBySymbolParams[3]).toEqual(new Date('2021-09-12T13:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[4]).toEqual(new Date('2021-09-13T12:00:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 10 period of 6 hours interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T05:01:00.500Z');
      MockDate.set(date);
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks().values;
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '6h', 10, date.valueOf());
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('6h');
        expect(getAllBySymbolParams[3]).toEqual(new Date('2021-09-10T18:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[4]).toEqual(new Date('2021-09-13T05:01:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 5 period of 12 hours interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T12:00:00.000Z');
      MockDate.set(date);
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks().values;
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '12h', 5, date.valueOf());
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('12h');
        expect(getAllBySymbolParams[3]).toEqual(new Date('2021-09-11T12:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[4]).toEqual(new Date('2021-09-13T12:00:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 3 periods of 1 day interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T00:00:30.000Z');
      MockDate.set(date);
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks().values;
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1d', 3, date.valueOf());
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('1d');
        expect(getAllBySymbolParams[3]).toEqual(new Date('2021-09-11T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[4]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
      });
    });
  });

  describe('Given candlesticks to retrieve for the last 100 periods of 1 day interval', () => {
    beforeEach(() => {
      date = new Date('2021-09-13T00:00:30.000Z');
      MockDate.set(date);
    });

    describe('When candlesticks are found', () => {
      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks().values;
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const results = await getCandlestickService.getAllLastBySymbol('Binance', 'ABC', '1d', 100, date.valueOf());
        expect(results).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('Binance');
        expect(getAllBySymbolParams[1]).toEqual('ABC');
        expect(getAllBySymbolParams[2]).toEqual('1d');
        expect(getAllBySymbolParams[3]).toEqual(new Date('2021-06-06T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[4]).toEqual(new Date('2021-09-13T00:00:00.000Z').valueOf());
      });
    });
  });
});
