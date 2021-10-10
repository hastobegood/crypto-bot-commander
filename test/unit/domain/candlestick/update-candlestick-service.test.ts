import { mocked } from 'ts-jest/utils';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { CandlestickClient } from '../../../../src/code/domain/candlestick/candlestick-client';
import { Candlestick } from '../../../../src/code/domain/candlestick/model/candlestick';
import { buildDefaultCandlesticks } from '../../../builders/domain/candlestick/candlestick-test-builder';
import { UpdateCandlestickService } from '../../../../src/code/domain/candlestick/update-candlestick-service';
import MockDate from 'mockdate';

const candlestickClientMock = mocked(jest.genMockFromModule<CandlestickClient>('../../../../src/code/domain/candlestick/candlestick-client'), true);
const candlestickRepositoryMock = mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let updateCandlestickService: UpdateCandlestickService;
beforeEach(() => {
  candlestickClientMock.getAllBySymbol = jest.fn();
  candlestickRepositoryMock.saveAllBySymbol = jest.fn();

  updateCandlestickService = new UpdateCandlestickService(candlestickClientMock, candlestickRepositoryMock);
});

describe('UpdateCandlestickService', () => {
  let date: Date;

  beforeEach(() => {
    date = new Date('2021-09-17T00:00:11.666Z');
    MockDate.set(date);
  });

  describe('Given a symbol candlesticks to update', () => {
    describe('When candlesticks are not found', () => {
      beforeEach(() => {
        candlestickClientMock.getAllBySymbol.mockResolvedValue([]);
      });

      it('Then candlesticks are not saved', async () => {
        await updateCandlestickService.updateAllBySymbol('ABC');

        expect(candlestickClientMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickClientMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-16T23:59:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-17T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[3]).toEqual(2);
        expect(getAllBySymbolParams[4]).toEqual('1m');

        expect(candlestickRepositoryMock.saveAllBySymbol).toHaveBeenCalledTimes(0);
      });
    });

    describe('When candlesticks are found', () => {
      let candlesticks: Candlestick[];

      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks();
        candlestickClientMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are saved', async () => {
        await updateCandlestickService.updateAllBySymbol('ABC');

        expect(candlestickClientMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickClientMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(5);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(new Date('2021-09-16T23:59:00.000Z').valueOf());
        expect(getAllBySymbolParams[2]).toEqual(new Date('2021-09-17T00:00:00.000Z').valueOf());
        expect(getAllBySymbolParams[3]).toEqual(2);
        expect(getAllBySymbolParams[4]).toEqual('1m');

        expect(candlestickRepositoryMock.saveAllBySymbol).toHaveBeenCalledTimes(1);
        const saveAllBySymbolParams = candlestickRepositoryMock.saveAllBySymbol.mock.calls[0];
        expect(saveAllBySymbolParams.length).toEqual(2);
        expect(saveAllBySymbolParams[0]).toEqual('ABC');
        expect(saveAllBySymbolParams[1]).toEqual(candlesticks);
      });
    });
  });
});
