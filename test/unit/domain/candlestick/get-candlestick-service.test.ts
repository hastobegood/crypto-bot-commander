import { mocked } from 'ts-jest/utils';
import { GetCandlestickService } from '../../../../src/code/domain/candlestick/get-candlestick-service';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { Candlestick } from '../../../../src/code/domain/candlestick/model/candlestick';
import { buildDefaultCandlesticks } from '../../../builders/domain/candlestick/candlestick-test-builder';

const candlestickRepositoryMock = mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let getCandlestickService: GetCandlestickService;
beforeEach(() => {
  candlestickRepositoryMock.getAllBySymbol = jest.fn();

  getCandlestickService = new GetCandlestickService(candlestickRepositoryMock);
});

describe('GetCandlestickService', () => {
  describe('Given all candlesticks to retrieve for a specific symbol', () => {
    describe('When candlesticks are found', () => {
      let candlesticks: Candlestick[];

      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks();
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then candlesticks are returned', async () => {
        const result = await getCandlestickService.getAllBySymbol('ABC', 1, '1d');
        expect(result).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(1);
        expect(getAllBySymbolParams[2]).toEqual('1d');
      });
    });

    describe('When candlesticks are not found', () => {
      beforeEach(() => {
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue([]);
      });

      it('Then empty list is returned', async () => {
        const result = await getCandlestickService.getAllBySymbol('ABC', 1, '1d');
        expect(result).toEqual([]);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getAllBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getAllBySymbolParams.length).toEqual(3);
        expect(getAllBySymbolParams[0]).toEqual('ABC');
        expect(getAllBySymbolParams[1]).toEqual(1);
        expect(getAllBySymbolParams[2]).toEqual('1d');
      });
    });
  });
});
