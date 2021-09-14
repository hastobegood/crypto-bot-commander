import { mocked } from 'ts-jest/utils';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { InitializeCandlestickService } from '../../../../src/code/domain/candlestick/initialize-candlestick-service';
import { CandlestickClient } from '../../../../src/code/domain/candlestick/candlestick-client';
import { Candlestick } from '../../../../src/code/domain/candlestick/model/candlestick';
import { buildDefaultCandlesticks } from '../../../builders/domain/candlestick/candlestick-test-builder';

const candlestickClientMock = mocked(jest.genMockFromModule<CandlestickClient>('../../../../src/code/domain/candlestick/candlestick-client'), true);
const candlestickRepositoryMock = mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let initializeCandlestickService: InitializeCandlestickService;
beforeEach(() => {
  candlestickClientMock.getAllBySymbol = jest.fn();
  candlestickRepositoryMock.saveAllBySymbol = jest.fn();

  initializeCandlestickService = new InitializeCandlestickService(candlestickClientMock, candlestickRepositoryMock);
});

describe('InitCandlestickService', () => {
  describe('Given a symbol candlesticks to initialize for a specific year and month', () => {
    describe('When symbol candlesticks are retrieved', () => {
      let candlesticks1: Candlestick[];
      let candlesticks2: Candlestick[];
      let candlesticks3: Candlestick[];

      beforeEach(() => {
        candlesticks1 = buildDefaultCandlesticks();
        candlesticks2 = buildDefaultCandlesticks();
        candlesticks3 = buildDefaultCandlesticks();
        candlestickClientMock.getAllBySymbol.mockResolvedValueOnce(candlesticks1).mockResolvedValueOnce(candlesticks2).mockResolvedValueOnce(candlesticks3).mockResolvedValue([]);
      });

      it('Then symbol candlesticks are saved', async () => {
        await initializeCandlestickService.initializeAllBySymbol('ABC', 2021, 9);

        expect(candlestickClientMock.getAllBySymbol).toHaveBeenCalledTimes(44);
        const getAllBySymbolParams = candlestickClientMock.getAllBySymbol.mock.calls;
        expect(getAllBySymbolParams[0]).toEqual(['ABC', new Date('2021-09-01T00:00:00.000Z').valueOf(), new Date('2021-09-01T16:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[1]).toEqual(['ABC', new Date('2021-09-01T16:40:00.000Z').valueOf(), new Date('2021-09-02T09:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[2]).toEqual(['ABC', new Date('2021-09-02T09:20:00.000Z').valueOf(), new Date('2021-09-03T01:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[3]).toEqual(['ABC', new Date('2021-09-03T02:00:00.000Z').valueOf(), new Date('2021-09-03T18:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[4]).toEqual(['ABC', new Date('2021-09-03T18:40:00.000Z').valueOf(), new Date('2021-09-04T11:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[5]).toEqual(['ABC', new Date('2021-09-04T11:20:00.000Z').valueOf(), new Date('2021-09-05T03:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[6]).toEqual(['ABC', new Date('2021-09-05T04:00:00.000Z').valueOf(), new Date('2021-09-05T20:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[7]).toEqual(['ABC', new Date('2021-09-05T20:40:00.000Z').valueOf(), new Date('2021-09-06T13:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[8]).toEqual(['ABC', new Date('2021-09-06T13:20:00.000Z').valueOf(), new Date('2021-09-07T05:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[9]).toEqual(['ABC', new Date('2021-09-07T06:00:00.000Z').valueOf(), new Date('2021-09-07T22:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[10]).toEqual(['ABC', new Date('2021-09-07T22:40:00.000Z').valueOf(), new Date('2021-09-08T15:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[11]).toEqual(['ABC', new Date('2021-09-08T15:20:00.000Z').valueOf(), new Date('2021-09-09T07:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[12]).toEqual(['ABC', new Date('2021-09-09T08:00:00.000Z').valueOf(), new Date('2021-09-10T00:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[13]).toEqual(['ABC', new Date('2021-09-10T00:40:00.000Z').valueOf(), new Date('2021-09-10T17:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[14]).toEqual(['ABC', new Date('2021-09-10T17:20:00.000Z').valueOf(), new Date('2021-09-11T09:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[15]).toEqual(['ABC', new Date('2021-09-11T10:00:00.000Z').valueOf(), new Date('2021-09-12T02:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[16]).toEqual(['ABC', new Date('2021-09-12T02:40:00.000Z').valueOf(), new Date('2021-09-12T19:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[17]).toEqual(['ABC', new Date('2021-09-12T19:20:00.000Z').valueOf(), new Date('2021-09-13T11:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[18]).toEqual(['ABC', new Date('2021-09-13T12:00:00.000Z').valueOf(), new Date('2021-09-14T04:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[19]).toEqual(['ABC', new Date('2021-09-14T04:40:00.000Z').valueOf(), new Date('2021-09-14T21:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[20]).toEqual(['ABC', new Date('2021-09-14T21:20:00.000Z').valueOf(), new Date('2021-09-15T13:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[21]).toEqual(['ABC', new Date('2021-09-15T14:00:00.000Z').valueOf(), new Date('2021-09-16T06:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[22]).toEqual(['ABC', new Date('2021-09-16T06:40:00.000Z').valueOf(), new Date('2021-09-16T23:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[23]).toEqual(['ABC', new Date('2021-09-16T23:20:00.000Z').valueOf(), new Date('2021-09-17T15:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[24]).toEqual(['ABC', new Date('2021-09-17T16:00:00.000Z').valueOf(), new Date('2021-09-18T08:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[25]).toEqual(['ABC', new Date('2021-09-18T08:40:00.000Z').valueOf(), new Date('2021-09-19T01:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[26]).toEqual(['ABC', new Date('2021-09-19T01:20:00.000Z').valueOf(), new Date('2021-09-19T17:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[27]).toEqual(['ABC', new Date('2021-09-19T18:00:00.000Z').valueOf(), new Date('2021-09-20T10:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[28]).toEqual(['ABC', new Date('2021-09-20T10:40:00.000Z').valueOf(), new Date('2021-09-21T03:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[29]).toEqual(['ABC', new Date('2021-09-21T03:20:00.000Z').valueOf(), new Date('2021-09-21T19:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[30]).toEqual(['ABC', new Date('2021-09-21T20:00:00.000Z').valueOf(), new Date('2021-09-22T12:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[31]).toEqual(['ABC', new Date('2021-09-22T12:40:00.000Z').valueOf(), new Date('2021-09-23T05:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[32]).toEqual(['ABC', new Date('2021-09-23T05:20:00.000Z').valueOf(), new Date('2021-09-23T21:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[33]).toEqual(['ABC', new Date('2021-09-23T22:00:00.000Z').valueOf(), new Date('2021-09-24T14:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[34]).toEqual(['ABC', new Date('2021-09-24T14:40:00.000Z').valueOf(), new Date('2021-09-25T07:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[35]).toEqual(['ABC', new Date('2021-09-25T07:20:00.000Z').valueOf(), new Date('2021-09-25T23:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[36]).toEqual(['ABC', new Date('2021-09-26T00:00:00.000Z').valueOf(), new Date('2021-09-26T16:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[37]).toEqual(['ABC', new Date('2021-09-26T16:40:00.000Z').valueOf(), new Date('2021-09-27T09:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[38]).toEqual(['ABC', new Date('2021-09-27T09:20:00.000Z').valueOf(), new Date('2021-09-28T01:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[39]).toEqual(['ABC', new Date('2021-09-28T02:00:00.000Z').valueOf(), new Date('2021-09-28T18:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[40]).toEqual(['ABC', new Date('2021-09-28T18:40:00.000Z').valueOf(), new Date('2021-09-29T11:19:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[41]).toEqual(['ABC', new Date('2021-09-29T11:20:00.000Z').valueOf(), new Date('2021-09-30T03:59:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[42]).toEqual(['ABC', new Date('2021-09-30T04:00:00.000Z').valueOf(), new Date('2021-09-30T20:39:00.000Z').valueOf(), 1_000, '1m']);
        expect(getAllBySymbolParams[43]).toEqual(['ABC', new Date('2021-09-30T20:40:00.000Z').valueOf(), new Date('2021-09-30T23:59:00.000Z').valueOf(), 1_000, '1m']);

        expect(candlestickRepositoryMock.saveAllBySymbol).toHaveBeenCalledTimes(3);
        const saveAllBySymbolParams = candlestickRepositoryMock.saveAllBySymbol.mock.calls;
        expect(saveAllBySymbolParams[0]).toEqual(['ABC', candlesticks1]);
        expect(saveAllBySymbolParams[1]).toEqual(['ABC', candlesticks2]);
        expect(saveAllBySymbolParams[2]).toEqual(['ABC', candlesticks3]);
      });
    });
  });
});
